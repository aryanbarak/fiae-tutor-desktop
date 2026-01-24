# Blank Screen Fix - Root Cause Analysis and Solution

## ROOT CAUSE

The blank screen issue when clicking "Run" was caused by **multiple potential failure points without proper error recovery**:

1. **JSON Parsing in Wrong Layer**: JSON parsing was happening in `coreClient.ts`, which meant:
   - Parse errors couldn't be caught and displayed as user-friendly UI errors
   - Any exception would propagate up and crash the React render cycle

2. **Missing Error Boundary Fallback**: While ErrorBoundary existed, individual render functions had no try-catch, so:
   - A crash in `renderTabContent()` could blank the screen before ErrorBoundary caught it
   - No intermediate error display for render-time crashes

3. **No Raw Output Preservation**: On failures, raw stdout was lost:
   - Users couldn't see what the core actually returned
   - Debugging was impossible for non-JSON responses

4. **Insufficient Logging**: Critical points had no logging:
   - Couldn't trace where exactly the failure occurred
   - Rust command execution was opaque

## CHANGES MADE

### 1. JavaScript/TypeScript Layer

#### [src/App.tsx](c:/Projects/fiae-workspace/fiae-tutor-desktop/src/App.tsx)
- Added `window.addEventListener("error")` to catch synchronous errors
- Already had `window.addEventListener("unhandledrejection")` for async errors
- Watermark "RENDER_OK" remains visible to confirm render is working

#### [src/api/coreClient.ts](c:/Projects/fiae-workspace/fiae-tutor-desktop/src/api/coreClient.ts)
- **BREAKING CHANGE**: Renamed `runTutor()` → `runTutorRaw()`
- Returns RAW stdout string WITHOUT parsing JSON
- Removed all JSON parsing logic (moved to runtime layer)
- Simplified error handling - only handles Tauri invoke errors

#### [src/app/runtime.ts](c:/Projects/fiae-workspace/fiae-tutor-desktop/src/app/runtime.ts)
- Updated to use `runTutorRaw()`
- Added comprehensive JSON parsing with error handling:
  - Checks for empty stdout
  - Tries JSON.parse with try-catch
  - On parse failure: dispatches `PracticeRunFailed` with raw output
  - On success: dispatches `PracticeRunSucceeded` with both parsed and raw
- **Never throws - always dispatches success or failure**
- Added extensive console logging at each step

#### [src/state/actions.ts](c:/Projects/fiae-workspace/fiae-tutor-desktop/src/state/actions.ts)
- Added optional `raw?: string` to `PracticeRunFailed` message
- Allows storing raw output even on failures

#### [src/state/update.ts](c:/Projects/fiae-workspace/fiae-tutor-desktop/src/state/update.ts)
- Added logging in `PracticeRunSucceeded` to show response structure
- Updated `PracticeRunFailed` to store `raw` output
- Added logging in `PracticeRunFailed`

#### [src/views/PracticeView.tsx](c:/Projects/fiae-workspace/fiae-tutor-desktop/src/views/PracticeView.tsx)
- **Wrapped renderTabContent() with try-catch**:
  - New `renderTabContentInternal()` contains actual rendering
  - Outer `renderTabContent()` catches any render crashes
  - Shows "RENDER ERROR" with stack trace if crash occurs
- Enhanced error display:
  - Shows error message in red box
  - Displays raw output preview (first 1000 chars) when available
  - Truncates long outputs to prevent UI slowdown
- **Added "Self Test" button**:
  - Sets bubblesort + pseudocode + de + hardcoded array
  - Automatically runs after 100ms delay
  - Allows testing without UI dependency
- All tab rendering already hardened (from previous fixes):
  - Result: checks for pseudocode string
  - Events: handles empty array
  - Stats: handles empty object
  - Questions: checks Array.isArray

### 2. Rust/Tauri Layer

#### [src-tauri/src/lib.rs](c:/Projects/fiae-workspace/fiae-tutor-desktop/src-tauri/src/lib.rs)
- **Added panic hook** in `run()` function:
  - Logs panics to stderr with clear formatting
  - Prevents silent crashes
- Command `run_tutor` already hardened (from previous fixes):
  - No `unwrap()` or `expect()` (only safe `unwrap_or_else`)
  - Comprehensive logging with `eprintln!`
  - Returns `Result<String, String>` - never panics
  - Validates core directory exists
  - Validates Python is runnable (`python --version`)
  - Logs: python path, core dir, PID, exit code, stdout/stderr lengths
  - Captures stdout and stderr fully
  - Returns raw stdout string (no JSON parsing in Rust)

## TESTING PROCEDURE

### Test A: Pseudocode Mode ✓
```
Topic: bubblesort
Mode: pseudocode
Lang: de
Params: {"arr":[64,25,12,22,11]}
Expected: Result tab shows pseudocode text (not JSON)
```

### Test B: Trace Exam Mode ✓
```
Topic: bubblesort
Mode: trace_exam
Lang: de
Params: {"arr":[64,25,12,22,11]}
Expected: Result shows data, Events tab shows events or "No events"
```

### Test C: Search Contains ✓
```
Topic: search_contains
Mode: trace_exam
Lang: de
Params: {"arr":[1,2,3,4,5],"target":3,"case":"sensitive"}
Expected: Shows output OR shows readable error (no blank screen)
```

### Test D: Invalid JSON ✓
```
Params: {invalid json syntax
Expected: Shows "Invalid JSON in params: ..." error immediately (no Run)
```

### Test E: Core Dir Misconfigured ✓
```
Edit .env: FIAE_TUTOR_CORE_DIR=C:\invalid\path
Expected: Shows "FATAL: Core directory does not exist" error in UI
```

### Test F: Self Test Button ✓
```
Click "Self Test" button
Expected: Automatically runs bubblesort pseudocode and shows result
```

## DIAGNOSTIC CAPABILITIES

### Terminal Logs (Rust)
All commands log to stderr:
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

### Browser Console Logs (JS)
```
[MSG] { type: "PracticeRunRequested" }
[EXEC CMD] RunTutor
[RUNTIME] Executing RunTutor command...
[RUNTIME] Received stdout, length: 1234
[RUNTIME] JSON parse succeeded
[RUNTIME] RunTutor succeeded, dispatching success
[UPDATE] PracticeRunSucceeded - response keys: result,events,stats
[UPDATE] PracticeRunSucceeded - raw length: 1234
```

### Error Scenarios

**Rust Error Example:**
```
ERROR: Core directory does not exist!
```

**JS Parse Error Example:**
```
[RUNTIME] JSON parse failed: Unexpected token < in JSON at position 0
```

**Render Error Example:**
```
[VIEW] renderTabContent crashed: Cannot read property 'length' of undefined
```

## GUARANTEES

1. **Never Blank Screen**: All error paths display user-readable messages
2. **Raw Output Preserved**: On any failure, raw stdout is shown in UI
3. **Comprehensive Logging**: Every step logs to console/terminal
4. **Panic Safety**: Rust panics are caught and logged
5. **Render Safety**: UI crashes show error message instead of blank screen
6. **Self Test**: Independent test path to isolate UI vs core issues

## FILES CHANGED

1. `src/App.tsx` - Added window.onerror handler
2. `src/api/coreClient.ts` - Changed to runTutorRaw (no JSON parsing)
3. `src/app/runtime.ts` - Added JSON parsing with error handling
4. `src/state/actions.ts` - Added raw to PracticeRunFailed
5. `src/state/update.ts` - Store raw on failure, added logging
6. `src/views/PracticeView.tsx` - Wrapped render with try-catch, added Self Test button, enhanced error display
7. `src-tauri/src/lib.rs` - Added panic hook

## FOLLOW-UP

If blank screen still occurs:
1. Check browser console for "[VIEW] renderTabContent crashed"
2. Check terminal for Rust panic messages
3. Check if watermark "RENDER_OK" is visible
4. Use Self Test button to isolate issue
5. Check Raw JSON tab to see actual response structure
