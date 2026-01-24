# Quick Test Checklist

Run through these tests to verify the MVU architecture is working:

## ✅ Start App
```bash
cd c:/Projects/fiae-workspace/fiae-tutor-desktop
npm run tauri dev
```
Wait for app to load at http://localhost:1420

## ✅ Test 1: Parameter Validation

1. Select topic: **binarysearch**
2. Check that default params include `"target": 7` ✅
3. Delete the line `"target": 7,` from params
4. Verify error message appears: "Missing required parameter: target" ❌
5. Verify Run button is **disabled** 🔒
6. Add back `"target": 7,`
7. Verify error clears ✅
8. Verify Run button is **enabled** 🟢

## ✅ Test 2: Run Each Topic With Defaults

Click Run for each topic and verify it succeeds:

- [ ] **bubblesort** → Result shows pseudocode
- [ ] **binarysearch** → Result shows search (target: 7)
- [ ] **search_contains** → Result shows contains check
- [ ] **insertionsort** → Result shows sorting
- [ ] **selectionsort** → Result shows sorting  
- [ ] **minimum** → Result shows minimum from index
- [ ] **count_condition** → Result shows count
- [ ] **minmax_avg** → Result shows min/max/avg
- [ ] **maxperiod** → Result shows longest 1s sequence
- [ ] **checksum** → Result shows checksum

## ✅ Test 3: Tab Switching

1. Run **bubblesort** pseudocode
2. Click each tab:
   - **Result** → Shows pseudocode formatted ✅
   - **Events** → Shows events table ✅
   - **Questions** → (May be empty for pseudocode mode) ✅
   - **Stats** → Shows statistics ✅
   - **Raw** → Shows pretty JSON ✅
   - **Logs** → Shows execution logs ✅
3. Verify NO blank screens occur 🚫

## ✅ Test 4: Request Preview

1. Click **▶ Request Preview** accordion
2. Verify JSON appears:
   ```json
   {
     "version": "1.0",
     "topic": "bubblesort",
     "mode": "pseudocode",
     "lang": "de",
     "params": { "arr": [64, 25, 12, 22, 11] }
   }
   ```
3. Click again → Verify it collapses ✅

## ✅ Test 5: Copy Buttons

1. Click **📋 Copy Request**
2. Open Notepad and paste (Ctrl+V)
3. Verify request JSON is pasted ✅
4. Run a successful request (click ▶️ Run)
5. Click **📋 Copy Result**
6. Paste in Notepad
7. Verify response JSON is pasted ✅

## ✅ Test 6: Self-Test

1. Click **🧪 Self Test** button
2. Wait ~5-10 seconds
3. Click **Logs** tab
4. Verify output shows:
   ```
   [SELF-TEST] Starting 3 test requests...
   [SELF-TEST] Running: BubbleSort Pseudocode
   [SELF-TEST] ✅ PASS BubbleSort Pseudocode
   [SELF-TEST] Running: BinarySearch Pseudocode
   [SELF-TEST] ✅ PASS BinarySearch Pseudocode
   [SELF-TEST] Running: SearchContains Trace Exam
   [SELF-TEST] ✅ PASS SearchContains Trace Exam
   [SELF-TEST] Complete: 3 passed, 0 failed
   ```
5. All 3 tests should PASS ✅

## ✅ Test 7: Error Handling

1. Edit params to invalid JSON:
   ```
   {this is not valid json
   ```
2. Verify error appears: "JSON syntax error: ..." ❌
3. Verify Run button is disabled 🔒
4. Fix JSON to valid but wrong params:
   ```json
   {"wrong_key": "value"}
   ```
5. Verify validation error appears ❌
6. Fix params back to valid:
   ```json
   {"arr": [1, 2, 3]}
   ```
7. Verify error clears and Run is enabled ✅

## 🎉 Success Criteria

All tests above should pass. If any test fails, check:

1. **Python core** is in correct path: `C:\Projects\fiae-workspace\fiae-tutor-core`
2. **Python** is accessible (version 3.13.9)
3. **fiae_tutor** module is importable
4. **Browser console** (F12) for JS errors
5. **Terminal** for Rust/Python errors

## 📝 Notes

- **selectionsort** uses "array" param (not "arr") - this is correct
- **Self-test** may take 5-10 seconds to run 3 requests
- **Logs tab** accumulates entries across multiple runs
- **Request preview** only shows if params are valid JSON

---

**Test Date**: _____________  
**Tester**: _____________  
**Result**: ☐ PASS ☐ FAIL  
**Notes**: _____________________________________________
