import { safeInvoke } from "../lib/tauriInvoke";

/**
 * Calls the Python core CLI via Tauri command
 * Returns RAW stdout string (does NOT parse JSON - let caller handle that)
 * @param req - Request object to send to the core
 * @returns Raw stdout string from Python process
 * @throws Error with descriptive message if communication fails
 */
export async function runTutorRaw(req: unknown): Promise<string> {
  console.log("[CLIENT] runTutorRaw called");
  
  // Validate request
  if (!req || typeof req !== "object") {
    throw new Error("Invalid request: must be a non-null object");
  }

  let stdout: string;
  
  try {
    console.log("[CLIENT] Invoking run_tutor...");
    // Invoke the Tauri command
    stdout = await safeInvoke<string>("run_tutor", {
      requestJson: JSON.stringify(req),
    });
    console.log("[CLIENT] run_tutor returned, length:", stdout?.length ?? 0);
  } catch (error) {
    console.error("[CLIENT] run_tutor threw:", error);
    // Tauri command failed - error message comes from Rust
    if (error instanceof Error) {
      throw new Error(`Core execution failed: ${error.message}`);
    }
    throw new Error(`Core communication failed: ${String(error)}`);
  }

  // Return raw stdout (caller will parse JSON)
  return stdout;
}

/**
 * Ping command to test Tauri communication independently
 * @returns "pong" on success
 */
export async function ping(): Promise<string> {
  console.log("[CLIENT] ping called");
  try {
    const result = await safeInvoke<string>("ping");
    console.log("[CLIENT] ping returned:", result);
    return result;
  } catch (error) {
    console.error("[CLIENT] ping threw:", error);
    throw error;
  }
}
