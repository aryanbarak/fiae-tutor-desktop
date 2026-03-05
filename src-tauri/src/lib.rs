use std::process::{Command, Stdio};
use std::io::Write;
use std::time::Duration;
use std::sync::mpsc;
use std::thread;

const TIMEOUT_SECS: u64 = 10;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn ping() -> Result<String, String> {
    eprintln!("[PING] Command received");
    Ok("pong".to_string())
}

#[tauri::command]
fn run_tutor(request_json: String) -> Result<String, String> {
    // Read environment variables with defaults
    let core_dir = std::env::var("FIAE_TUTOR_CORE_DIR")
        .unwrap_or_else(|_| r"C:\Projects\fiae-workspace\fiae-tutor-core".to_string());
    
    let python_cmd = std::env::var("FIAE_TUTOR_PYTHON")
        .unwrap_or_else(|_| "python".to_string());

    // Debug logging - show environment
    eprintln!("=== run_tutor STARTING ===");
    eprintln!("Python command: {}", python_cmd);
    eprintln!("Core directory: {}", core_dir);

    // Validate core directory exists
    let core_path = std::path::Path::new(&core_dir);
    if !core_path.exists() {
        eprintln!("ERROR: Core directory does not exist!");
        return Err(format!(
            "FATAL: Core directory does not exist: {}\n\
             Please verify FIAE_TUTOR_CORE_DIR in .env points to the correct path.",
            core_dir
        ));
    }
    
    if !core_path.is_dir() {
        eprintln!("ERROR: Core path exists but is not a directory!");
        return Err(format!(
            "FATAL: Core path exists but is not a directory: {}",
            core_dir
        ));
    }
    
    eprintln!("Core directory validated: {}", core_dir);

    // Validate Python is runnable
    eprintln!("Validating Python executable...");
    let version_check = Command::new(&python_cmd)
        .arg("--version")
        .output();
    
    match version_check {
        Ok(output) => {
            if output.status.success() {
                let version = String::from_utf8_lossy(&output.stdout);
                let version_err = String::from_utf8_lossy(&output.stderr);
                eprintln!("Python version check OK: {}{}", version.trim(), version_err.trim());
            } else {
                eprintln!("ERROR: Python --version failed!");
                return Err(format!(
                    "FATAL: Python executable failed version check.\n\
                     Command: {} --version\n\
                     Exit code: {:?}",
                    python_cmd, output.status.code()
                ));
            }
        }
        Err(e) => {
            eprintln!("ERROR: Cannot execute Python!");
            return Err(format!(
                "FATAL: Python is not runnable.\n\
                 Error: {}\n\
                 Python command: {}\n\
                 Ensure Python is installed and in PATH, or set FIAE_TUTOR_PYTHON correctly.",
                e, python_cmd
            ));
        }
    }

    eprintln!("Spawning Python process: {} -m fiae_tutor.cli", python_cmd);

    // Spawn the Python process
    let mut child = Command::new(&python_cmd)
        .args(["-m", "fiae_tutor.cli"])
        .current_dir(&core_dir)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| {
            eprintln!("ERROR: Failed to spawn Python process!");
            format!(
                "FATAL: Failed to spawn Python process.\n\
                 Error: {}\n\
                 Python command: {}\n\
                 Working directory: {}\n\
                 Ensure Python is installed and fiae_tutor module is accessible.",
                e, python_cmd, core_dir
            )
        })?;

    // Capture PID for potential timeout kill
    let pid = child.id();
    eprintln!("Python process spawned with PID: {}", pid);

    // Write request JSON to stdin and immediately close it
    if let Some(mut stdin) = child.stdin.take() {
        stdin.write_all(request_json.as_bytes())
            .map_err(|e| {
                eprintln!("ERROR: Failed to write to stdin!");
                format!("Failed to write request to stdin: {}", e)
            })?;
        // Explicitly drop stdin to close the pipe and signal EOF to Python
        drop(stdin);
    }

    eprintln!("Request written to stdin, waiting for output...");

    // Wait for process with timeout using thread + channel
    let (tx, rx) = mpsc::channel::<std::io::Result<std::process::Output>>();
    
    thread::spawn(move || {
        let result = child.wait_with_output();
        let _ = tx.send(result);
    });

    // Wait with timeout
    let timeout = Duration::from_secs(TIMEOUT_SECS);
    let output = match rx.recv_timeout(timeout) {
        Ok(result) => result.map_err(|e| {
            eprintln!("ERROR: Process execution error!");
            format!("Process execution error: {}", e)
        })?,
        Err(mpsc::RecvTimeoutError::Timeout) => {
            // Timeout occurred - kill the process
            eprintln!("TIMEOUT after {}s, killing process {}", TIMEOUT_SECS, pid);
            
            // Kill process tree on Windows
            let kill_result = Command::new("taskkill")
                .args(["/PID", &pid.to_string(), "/T", "/F"])
                .output();
            
            match kill_result {
                Ok(_) => eprintln!("Process {} killed successfully", pid),
                Err(e) => eprintln!("Failed to kill process {}: {}", pid, e),
            }
            
            return Err(format!(
                "TIMEOUT: Python process did not respond within {} seconds.\n\
                 The process has been terminated. Please check the core CLI.",
                TIMEOUT_SECS
            ));
        }
        Err(mpsc::RecvTimeoutError::Disconnected) => {
            eprintln!("ERROR: Channel disconnected!");
            return Err("Channel disconnected - thread may have panicked".to_string());
        }
    };

    eprintln!("Process finished with exit code: {:?}", output.status.code());

    // Check exit code
    if output.status.success() {
        let stdout = String::from_utf8(output.stdout)
            .map_err(|e| {
                eprintln!("ERROR: Invalid UTF-8 in stdout!");
                format!("Invalid UTF-8 in stdout: {}", e)
            })?;
        
        eprintln!("SUCCESS: Process completed, stdout length: {} bytes", stdout.len());
        
        // If stdout is empty but we succeeded, that's suspicious
        if stdout.trim().is_empty() {
            eprintln!("WARNING: stdout is empty despite success");
            let stderr = String::from_utf8(output.stderr)
                .unwrap_or_else(|_| "[Failed to decode stderr]".to_string());
            if !stderr.trim().is_empty() {
                eprintln!("stderr content: {}", stderr);
                return Err(format!("Process succeeded but stdout is empty. stderr:\n{}", stderr));
            }
            return Err("Process succeeded but produced no output".to_string());
        }
        
        eprintln!("=== run_tutor COMPLETE ===");
        Ok(stdout)
    } else {
        let exit_code = output.status.code().unwrap_or(-1);
        eprintln!("FAILURE: Process failed with exit code: {}", exit_code);
        
        let stderr = String::from_utf8(output.stderr)
            .unwrap_or_else(|_| "[Failed to decode stderr]".to_string());
        let stdout = String::from_utf8(output.stdout)
            .unwrap_or_else(|_| "[Failed to decode stdout]".to_string());
        
        // Log error details
        if !stderr.trim().is_empty() {
            eprintln!("STDERR:\n{}", stderr);
        }
        if !stdout.trim().is_empty() {
            eprintln!("STDOUT:\n{}", stdout);
        }
        
        // Return both stderr and stdout for better debugging
        let mut error_msg = format!("Python process failed with exit code: {}\n", exit_code);
        if !stderr.trim().is_empty() {
            error_msg.push_str(&format!("STDERR:\n{}\n", stderr));
        }
        if !stdout.trim().is_empty() {
            error_msg.push_str(&format!("STDOUT:\n{}\n", stdout));
        }
        
        eprintln!("=== run_tutor FAILED ===");
        Err(error_msg)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Set up panic hook to log panics to stderr
    std::panic::set_hook(Box::new(|panic_info| {
        eprintln!("========================================");
        eprintln!("PANIC OCCURRED:");
        eprintln!("{}", panic_info);
        eprintln!("========================================");
    }));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![greet, run_tutor, ping])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
