# 🔧 TESTING INSTRUCTIONS - Find Root Cause of Blank Screen

## QUICK START

1. **Open two terminals**:
   - Terminal 1: Run app with `npm run tauri dev`
   - Terminal 2: Keep open to view Rust logs

2. **Open browser DevTools**: F12 → Console tab

3. **Test in this order**:

---

## TEST 1: PING (Isolate Tauri Communication)

**Click**: Orange "Ping Tauri" button

### ✅ Expected Success:
- **Browser Console**:
  ```
  [VIEW] PING_CLICK
  [MSG] { type: "PingSelfTest" }
  [UPDATE] PING_CLICK
  [EXEC CMD] Ping
  [CLIENT] ping called
  [CLIENT] Invoking ping...
  [CLIENT] ping returned: pong
  [RUNTIME] PING_START
  [RUNTIME] PING_OK: pong
  [UPDATE] PING_OK: pong
  ```

- **Terminal (Rust)**:
  ```
  [PING] Command received
  ```

- **Raw JSON Tab** (click it):
  ```
  PING_CLICK
  PING_OK: pong
  ```

- **UI**: No blank screen, watermark "RENDER_OK" still visible

### ❌ If Ping Fails:
- **Blank screen** → Problem is in **JS/Tauri invoke layer** (not Python)
- **Red error banner** → Read error message (JS exception)
- **Check console** → Last log shows where crash occurred

---

## TEST 2: SELF TEST (Hardcoded Params)

**Click**: Green "Self Test" button

### ✅ Expected Success:
- **Browser Console** (full sequence):
  ```
  [VIEW] SELFTEST_CLICK
  [MSG] { type: "PracticeTopicChanged", topic: "bubblesort" }
  [MSG] { type: "PracticeModeChanged", mode: "pseudocode" }
  [MSG] { type: "PracticeLangChanged", lang: "de" }
  [MSG] { type: "PracticeParamsChanged", paramsText: {...} }
  [MSG] { type: "PracticeRunRequested" }
  [UPDATE] RUN_CLICK
  [EXEC CMD] RunTutor
  [CLIENT] runTutorRaw called
  [CLIENT] Invoking run_tutor...
  [RUNTIME] INVOKE_START
  [RUNTIME] Executing RunTutor command...
  [CLIENT] run_tutor returned, length: <N>
  [RUNTIME] INVOKE_DONE len: <N>
  [RUNTIME] PARSE_START
  [RUNTIME] PARSE_OK keys: result
  [RUNTIME] SUCCESS
  [UPDATE] PracticeRunSucceeded
  ```

- **Terminal (Rust)**:
  ```
  === run_tutor STARTING ===
  Python command: python
  Core directory: C:\Projects\fiae-workspace\fiae-tutor-core
  Core directory validated: ...
  Python version check OK: Python 3.11.5
  Spawning Python process: python -m fiae_tutor.cli
  Python process spawned with PID: <PID>
  Request written to stdin, waiting for output...
  Process finished with exit code: Some(0)
  SUCCESS: Process completed, stdout length: <N> bytes
  === run_tutor COMPLETE ===
  ```

- **Result Tab**: Shows bubblesort pseudocode in German

- **Raw JSON Tab**:
  ```
  RUN_CLICK
  [HH:MM:SS.mmm] INVOKE_START
  [HH:MM:SS.mmm] INVOKE_DONE len=<N>
  [HH:MM:SS.mmm] PARSE_START
  [HH:MM:SS.mmm] PARSE_OK keys=result
  [HH:MM:SS.mmm] SUCCESS
  
  📄 Raw JSON Response:
  {
    "result": "1. Setze i = 0\n2. ..."
  }
  ```

### ❌ If Self Test Fails:
- **Blank screen** → Check which layer failed (see flowchart in DEBUG_INSTRUMENTATION.md)
- **Red error banner** → JS exception (read error)
- **No terminal logs** → Rust command didn't execute
- **Terminal shows ERROR** → Python spawn/execution failed
- **PARSE_FAIL in logs** → Core returned non-JSON

---

## TEST 3: RUN (Manual Selection)

**Setup**:
1. Select: bubblesort
2. Select: trace_exam
3. Select: de
4. Params already set: `{"arr":[64,25,12,22,11]}`

**Click**: Blue "Run" button

### ✅ Expected Success:
- **Same logs as Self Test** (console + terminal)
- **Result Tab**: Shows execution result
- **Events Tab**: Shows events with stepper buttons
- **Stats Tab**: Shows statistics
- **Raw JSON Tab**: Full response with result, events, stats

### ❌ If Run Fails:
- Follow same debugging as Self Test

---

## DIAGNOSIS CHEAT SHEET

| Symptom | Last Log Seen | Root Cause | Location |
|---------|---------------|------------|----------|
| Blank screen, no logs | None | Click handler failed | HTML/React |
| `[VIEW] RUN_CLICK` only | VIEW log | Dispatch failed | MVU wiring |
| `[UPDATE] RUN_CLICK` only | UPDATE log | useEffect not triggered | App.tsx dependency |
| `[EXEC CMD] RunTutor` only | EXEC log | Runtime not executing | runtime.ts |
| `[CLIENT] runTutorRaw called` only | CLIENT log | Tauri invoke hung | Webview/Rust |
| Terminal shows "STARTING" only | Rust log | Python spawn failed | Rust Command |
| Terminal shows "PID: <N>" only | Rust log | Python timeout/hang | Python CLI |
| `INVOKE_DONE` but no `PARSE_START` | Runtime log | Pre-parse exception | runtime.ts |
| `PARSE_FAIL` logged | Runtime log | Core returned non-JSON | Python CLI output |
| `SUCCESS` but blank UI | Runtime log | React render crash | PracticeView.tsx |
| Red banner appears | Error overlay | JS exception | Stack trace in banner |

---

## AFTER TESTING - REPORT FORMAT

**Please provide**:

1. **Which test failed?** (Ping / Self Test / Run)

2. **Browser console output** (copy full logs)

3. **Terminal output** (copy Rust logs)

4. **Raw JSON tab content** (screenshot or copy debugLog)

5. **Screenshot** (if blank screen or error banner)

6. **Last log entry** (from console and/or terminal)

---

## ROOT CAUSE WILL BE ONE OF:

### A. Tauri Invoke Layer (if Ping fails)
- **Evidence**: Ping button causes blank screen
- **Fix**: JS runtime or webview issue

### B. Python Execution (if Ping works, Run fails)
- **Evidence**: Ping OK, but Run shows Rust errors
- **Fix**: Python spawn, timeout, or CLI crash

### C. JSON Parsing (if logs show PARSE_FAIL)
- **Evidence**: Runtime gets stdout but can't parse
- **Fix**: Core returning non-JSON (HTML error page?)

### D. React Render (if logs complete but UI blank)
- **Evidence**: SUCCESS logged but screen blank
- **Fix**: Render exception in PracticeView

### E. JS Exception (if red banner appears)
- **Evidence**: Global error overlay shows error
- **Fix**: Specific line from stack trace

---

## VISUAL INDICATORS

- ✅ **RENDER_OK** watermark visible → React rendering works
- 🔴 **Red banner** → JS exception caught
- ⚫ **Black screen** → No error caught (webview crash or infinite loop)
- 🟢 **Green "Self Test"** → Hardcoded test path
- 🟠 **Orange "Ping Tauri"** → Isolated Tauri test
- 🔵 **Blue "Run"** → Normal execution path

---

## FILES TO CHECK IF DEBUGGING MANUALLY

1. **Browser Console**: F12 → Console tab
2. **Terminal**: Where `npm run tauri dev` is running
3. **Raw JSON Tab**: Click tab to see debugLog
4. **DevTools Network**: Check if any requests failing
5. **DevTools Sources**: Set breakpoints if needed

---

## COMMON ISSUES

### Issue: "Core directory does not exist"
- **Fix**: Check `.env` file, ensure `FIAE_TUTOR_CORE_DIR` is correct

### Issue: "Python is not runnable"
- **Fix**: Check `.env` file, ensure `FIAE_TUTOR_PYTHON=python` or full path

### Issue: TIMEOUT after 10s
- **Fix**: Core CLI is hanging, test manually: `cd fiae-tutor-core; python -m fiae_tutor.cli`

### Issue: Parse error "Unexpected token <"
- **Fix**: Core returning HTML (error page), check stderr in terminal

### Issue: Empty stdout
- **Fix**: Core exiting without output, check exit code in terminal

---

## NEXT STEPS AFTER IDENTIFICATION

Once root cause is found, I will:
1. Provide exact file + line number
2. Explain why it caused blank screen
3. Implement fix
4. Re-test all three scenarios
5. Confirm: Ping ✓, Self Test ✓, Run ✓
