# Debug Instrumentation - Complete Implementation

## PROBLEM
Clicking "Run" or "Self Test" causes the window to go blank/black.
Core CLI works independently and returns valid JSON.
Need to identify exact root cause: Rust panic/hang vs JS exception/loop.

## SOLUTION - 6 LAYERS OF INSTRUMENTATION

### LAYER 1: Global Error Overlay (src/main.tsx)
**Purpose**: Catch ALL JavaScript errors and display them VISIBLY on screen

**Implementation**:
- Global error store (module-level)
- `window.addEventListener("error")` - catches synchronous errors
- `window.addEventListener("unhandledrejection")` - catches async errors
- `<GlobalErrorOverlay>` component - renders red banner at top with error + stack

**Result**: Any JS error will show a red banner with full details - never silent

---

### LAYER 2: Trace Logs in Model (src/state/model.ts)
**Purpose**: Store execution trace that survives even if UI crashes

**Implementation**:
- Added `debugLog: string[]` to PracticeModel
- Logs stored: RUN_CLICK, SELFTEST_CLICK, PING_CLICK, INVOKE_START, INVOKE_DONE, PARSE_START, PARSE_OK, PARSE_FAIL, etc.
- Displayed in Raw JSON tab - always accessible

**Result**: After clicking Run, open Raw JSON tab to see exact execution path

---

### LAYER 3: Comprehensive Runtime Logging (src/app/runtime.ts)
**Purpose**: Track every step of command execution with timestamps

**Implementation**:
```typescript
function logMsg(msg: string): string {
  const timestamp = new Date().toISOString().split("T")[1].slice(0, 12);
  return `[${timestamp}] ${msg}`;
}
```

**Logs generated**:
1. `INVOKE_START` - before calling Tauri
2. `INVOKE_DONE len=<N>` - after stdout received
3. `PARSE_START` - before JSON.parse
4. `PARSE_OK keys=<...>` - after successful parse
5. `PARSE_FAIL: <error>` - on parse failure
6. `INVOKE_THROW: <error>` - on invoke exception
7. `SUCCESS` - final success
8. `ERROR: <msg>` - any error

**Result**: Both console logs AND stored in model.debugLog

---

### LAYER 4: Ping Command Isolation (src-tauri/src/lib.rs)
**Purpose**: Test Tauri invoke independently from Python execution

**Implementation**:
```rust
#[tauri::command]
fn ping() -> Result<String, String> {
    eprintln!("[PING] Command received");
    Ok("pong".to_string())
}
```

**UI Button**: "Ping Tauri" button (orange)

**Test Logic**:
- If Ping works but Run fails → issue is in Python execution
- If Ping also blanks → issue is JS/Tauri invoke layer

**Result**: Isolates whether problem is Rust/Python vs JS

---

### LAYER 5: Enhanced Tauri Logging (src-tauri/src/lib.rs)
**Purpose**: Log every step of Python process execution

**Existing logs** (already comprehensive):
```
=== run_tutor STARTING ===
Python command: python
Core directory: C:\Projects\fiae-workspace\fiae-tutor-core
Core directory validated: ...
Validating Python executable...
Python version check OK: Python 3.11.5
Spawning Python process: python -m fiae_tutor.cli
Python process spawned with PID: 12345
Request written to stdin, waiting for output...
Process finished with exit code: Some(0)
SUCCESS: Process completed, stdout length: 1234 bytes
=== run_tutor COMPLETE ===
```

**Panic hook** (added):
```rust
std::panic::set_hook(Box::new(|panic_info| {
    eprintln!("========================================");
    eprintln!("PANIC OCCURRED:");
    eprintln!("{}", panic_info);
    eprintln!("========================================");
}));
```

**Timeout**: Hard 10-second timeout with process kill

**Result**: Terminal shows exact state of Rust execution - never silent

---

### LAYER 6: UI Hardening (src/views/PracticeView.tsx)
**Purpose**: Catch render crashes and display them

**Implementation**:
```typescript
function renderTabContent() {
  try {
    return renderTabContentInternal();
  } catch (error) {
    console.error("[VIEW] renderTabContent crashed:", error);
    return <div>⚠️ RENDER ERROR + stack</div>;
  }
}
```

**Click logging**:
- Run button: `console.log("[VIEW] RUN_CLICK")`
- Self Test button: `console.log("[VIEW] SELFTEST_CLICK")`
- Ping button: `console.log("[VIEW] PING_CLICK")`

**Result**: Render crashes show error instead of blank screen

---

## TESTING PROCEDURE

### Step 1: Test Ping (Isolate Tauri Invoke)
1. Run `npm run tauri dev`
2. Click "Ping Tauri" button
3. **Expected**: `debugLog` shows "PING_CLICK" → "PING_OK: pong"
4. **If ping blanks**: Problem is in JS/Tauri layer (not Python)
5. **If ping works**: Problem is in Python execution

### Step 2: Test Self Test (Hardcoded Params)
1. Click "Self Test" button
2. Check browser console for logs
3. Check terminal for Rust logs
4. Open Raw JSON tab to see debugLog
5. **Expected**: Shows bubblesort pseudocode text

### Step 3: Test Run (User Params)
1. Select: bubblesort + trace_exam + de
2. Click "Run"
3. Check logs (console + terminal + Raw tab)
4. **Expected**: Shows result + events

---

## DIAGNOSTIC FLOWCHART

```
Click Run/Self Test
       |
       v
[VIEW] RUN_CLICK logged? ──NO──> Click handler didn't fire (HTML issue)
       |YES
       v
[UPDATE] RUN_CLICK logged? ──NO──> Reducer didn't run (React issue)
       |YES
       v
[EXEC CMD] logged? ──NO──> useEffect didn't trigger (dependency issue)
       |YES
       v
[RUNTIME] INVOKE_START logged? ──NO──> Runtime didn't execute (dispatch issue)
       |YES
       v
[CLIENT] runTutorRaw called? ──NO──> Client function not reached
       |YES
       v
Rust logs appear? ──NO──> Tauri command didn't execute (webview crash)
       |YES
       v
Process spawned with PID? ──NO──> Python spawn failed
       |YES
       v
SUCCESS: stdout length? ──NO──> Python timeout or crash
       |YES
       v
[RUNTIME] INVOKE_DONE logged? ──NO──> Stdout not returned to JS
       |YES
       v
[RUNTIME] PARSE_START logged? ──NO──> Before parse, something threw
       |YES
       v
[RUNTIME] PARSE_OK logged? ──NO──> JSON parse failed (check PARSE_FAIL)
       |YES
       v
[UPDATE] PracticeRunSucceeded? ──NO──> Dispatch failed
       |YES
       v
UI shows result? ──NO──> Render crashed (check try-catch)
       |YES
       v
SUCCESS! 🎉
```

---

## EXPECTED CONSOLE OUTPUT (Success Case)

### Browser Console:
```
[VIEW] RUN_CLICK
[MSG] { type: "PracticeRunRequested" }
[UPDATE] RUN_CLICK
[EXEC CMD] RunTutor
[CLIENT] runTutorRaw called
[CLIENT] Invoking run_tutor...
[RUNTIME] INVOKE_START
[RUNTIME] Executing RunTutor command...
[CLIENT] run_tutor returned, length: 1234
[RUNTIME] INVOKE_DONE len: 1234
[RUNTIME] Received stdout, length: 1234
[RUNTIME] PARSE_START
[RUNTIME] PARSE_OK keys: result,events,stats
[RUNTIME] JSON parse succeeded
[RUNTIME] SUCCESS
[RUNTIME] RunTutor succeeded, dispatching success
[UPDATE] PracticeRunSucceeded - response keys: result,events,stats
[UPDATE] PracticeRunSucceeded - raw length: 1234
```

### Terminal (Rust):
```
=== run_tutor STARTING ===
Python command: python
Core directory: C:\Projects\fiae-workspace\fiae-tutor-core
Core directory validated: OK
Validating Python executable...
Python version check OK: Python 3.11.5
Spawning Python process: python -m fiae_tutor.cli
Python process spawned with PID: 12345
Request written to stdin, waiting for output...
Process finished with exit code: Some(0)
SUCCESS: Process completed, stdout length: 1234 bytes
=== run_tutor COMPLETE ===
```

### Raw JSON Tab (debugLog):
```
RUN_CLICK
[12:34:56.789] INVOKE_START
[12:34:57.123] INVOKE_DONE len=1234
[12:34:57.124] PARSE_START
[12:34:57.125] PARSE_OK keys=result,events,stats
[12:34:57.126] SUCCESS
```

---

## EXPECTED CONSOLE OUTPUT (Failure Case - Parse Error)

### Browser Console:
```
[VIEW] RUN_CLICK
[MSG] { type: "PracticeRunRequested" }
[UPDATE] RUN_CLICK
[EXEC CMD] RunTutor
[CLIENT] runTutorRaw called
[CLIENT] Invoking run_tutor...
[RUNTIME] INVOKE_START
[RUNTIME] Executing RunTutor command...
[CLIENT] run_tutor returned, length: 45
[RUNTIME] INVOKE_DONE len: 45
[RUNTIME] Received stdout, length: 45
[RUNTIME] PARSE_START
[RUNTIME] PARSE_FAIL: Unexpected token < in JSON at position 0
[RUNTIME] JSON parse failed: Unexpected token < in JSON at position 0
[UPDATE] PracticeRunFailed - error: Failed to parse core response as JSON...
```

### UI Shows:
- Red error box: "Failed to parse core response as JSON"
- Raw output preview: First 1000 chars of actual stdout

---

## FILES CHANGED

1. **src/main.tsx** - Global error store + visible overlay
2. **src/state/model.ts** - Added debugLog array
3. **src/state/actions.ts** - Added Ping messages, logs to Run messages
4. **src/state/commands.ts** - Added Ping command
5. **src/state/update.ts** - Store logs in debugLog, handle Ping
6. **src/app/runtime.ts** - Comprehensive logging with timestamps
7. **src/api/coreClient.ts** - Added ping() function, enhanced logging
8. **src/views/PracticeView.tsx** - Ping button, logs on clicks, debugLog display in Raw tab
9. **src-tauri/src/lib.rs** - Added ping command
10. **src/App.tsx** - Removed duplicate error handlers

---

## GUARANTEES

1. ✅ **Never Silent**: Global error overlay shows ALL JS errors
2. ✅ **Logs Survive**: debugLog stored in model, visible in Raw tab
3. ✅ **Rust Visible**: All Rust operations logged to terminal
4. ✅ **Isolated Test**: Ping command tests Tauri independently
5. ✅ **Render Safe**: Try-catch prevents blank screen on render crash
6. ✅ **Traceable**: Every step logged with timestamps

---

## NEXT STEPS

1. Run `npm run tauri dev`
2. Click "Ping Tauri" - confirm it shows "pong" in debugLog
3. Click "Self Test" - confirm bubblesort pseudocode appears
4. Click "Run" with bubblesort + trace_exam - confirm events appear
5. Check Raw JSON tab for debugLog after each operation
6. Review terminal output for Rust logs
7. Review browser console for JS logs

**If blank screen still occurs**:
- Check if global error overlay appears (red banner)
- Check Raw JSON tab for debugLog (what's the last entry?)
- Check browser console (what's the last log?)
- Check terminal (did Rust command execute?)
- Use flowchart above to pinpoint exact failure point

---

## ROOT CAUSE IDENTIFICATION

After testing, the exact failure point will be visible in logs:

**Scenario A**: Ping works, Run fails
- **Root Cause**: Python execution (spawn/timeout/stderr)
- **Location**: Rust run_tutor command or Python CLI

**Scenario B**: Ping fails (blanks screen)
- **Root Cause**: Tauri invoke layer
- **Location**: JS runtime or webview

**Scenario C**: Logs show PARSE_FAIL
- **Root Cause**: Core returning non-JSON
- **Location**: Python CLI output format

**Scenario D**: Logs stop at INVOKE_START
- **Root Cause**: Rust command hang or crash
- **Location**: Python process spawn or timeout

**Scenario E**: Global error overlay appears
- **Root Cause**: JS exception (exact line in stack trace)
- **Location**: Shown in error overlay

**Scenario F**: Logs complete but UI blank
- **Root Cause**: React render crash
- **Location**: Check renderTabContent try-catch error
