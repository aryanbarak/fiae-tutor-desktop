# 🎯 QUICK START - Find the Bug

## RUN THE APP
```bash
cd C:\Projects\fiae-workspace\fiae-tutor-desktop
npm run tauri dev
```

## OPEN DEVTOOLS
Press **F12** → Go to **Console** tab

## RUN TESTS (in order)

### 1️⃣ PING TEST
- Click: **Orange "Ping Tauri" button**
- Expected: See "pong" in Raw JSON tab
- If blank: Problem is Tauri invoke (NOT Python)

### 2️⃣ SELF TEST
- Click: **Green "Self Test" button**
- Expected: See bubblesort pseudocode
- If blank: Check console + terminal logs

### 3️⃣ MANUAL RUN
- Select: bubblesort + trace_exam + de
- Click: **Blue "Run" button**
- Expected: See result + events
- If blank: Check console + terminal logs

## CHECK THESE IMMEDIATELY

✅ **Browser Console** (F12): Shows JS logs  
✅ **Terminal**: Shows Rust logs  
✅ **Raw JSON Tab**: Shows debugLog  
✅ **RENDER_OK Watermark**: Should stay visible  

## IF BLANK SCREEN

1. Is there a **red error banner**? → Read the error message
2. Is **RENDER_OK** visible? → React still rendering
3. Check **console** → What's the last log?
4. Check **terminal** → Did Rust execute?
5. Check **Raw JSON tab** → What's in debugLog?

## COPY & REPORT

Please copy and send:
- ✅ Browser console output (all logs)
- ✅ Terminal output (Rust logs)
- ✅ Raw JSON tab content (screenshot)
- ✅ Last log entry you see

## I WILL THEN

1. Identify exact root cause
2. Tell you file + line number
3. Explain why it blanked
4. Fix it
5. Confirm all tests pass

---

**That's it! Run the app and test. The logs will tell us exactly what failed.**
