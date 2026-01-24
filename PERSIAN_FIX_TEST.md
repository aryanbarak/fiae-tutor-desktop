# Persian Explanations Fix - Test Checklist

## Summary of Changes

### Problem
- UI showed success but when `lang=fa`, only numeric result fields were displayed
- Persian explanation text was not showing despite being in the response
- No param normalization causing failures with `array` vs `arr`

### Root Causes
1. **Explain rendering bug**: Used `split("\\n")` (literal backslash-n) instead of rendering raw text
2. **CSS missing**: No `white-space: pre-wrap` to preserve newlines
3. **Priority issue**: Fallback to structured data shown instead of explain text
4. **Param mismatch**: Core expects `arr` but users type `array`
5. **Insufficient diagnostics**: Hard to debug what was sent vs received

### Fixes Applied

#### 1. Result Renderer (`src/components/renderers.tsx`)
**Before:**
```tsx
result.explain.split("\\n").map((line, idx) => <p>{line}</p>)
```

**After:**
```tsx
<div style={styles.explainText}>{result.explain}</div>
```

- Direct rendering of text (no splitting)
- Added `white-space: pre-wrap` CSS
- Check explain FIRST before fallback
- Other fields shown in collapsible `<details>` if present

#### 2. Param Normalization (`src/state/update.ts`)
**Added:**
```typescript
if ("array" in params && !("arr" in params)) {
  params.arr = params.array;
  delete params.array;
}
if ("num_questions" in params && !("numq" in params)) {
  params.numq = params.num_questions;
  delete params.num_questions;
}
```

#### 3. Diagnostics (`src/app/runtime.ts`, `src/state/update.ts`)
**Added logs:**
- `REQUEST: topic=X mode=Y lang=Z`
- `PARAMS: arr, target, ...`
- `RESULT_KEYS: explain, algorithm, ...`

#### 4. Error Messages
**Before:** `Parameter validation failed: Missing...`
**After:** `❌ Cannot run: Missing required parameters\n\n• Missing...`

## Test Scenarios

### ✅ Test 1: Persian Explanation
```json
{
  "topic": "insertionsort",
  "mode": "explain",
  "lang": "fa",
  "params": {"arr": [64, 25, 12, 22, 11]}
}
```
**Expected:**
- Result tab shows Persian explanation text
- Text has proper line breaks
- No "split" errors
- Other fields (algorithm, sorted) shown in "Other Result Fields" accordion

### ✅ Test 2: German Explanation
```json
{
  "topic": "bubblesort",
  "mode": "explain",
  "lang": "de",
  "params": {"arr": [5, 2, 8, 1]}
}
```
**Expected:**
- German explanation text shown
- Proper formatting

### ✅ Test 3: Missing Required Param
```json
{
  "topic": "search_contains",
  "mode": "pseudocode",
  "lang": "de",
  "params": {"arr": [1, 3, 5, 7, 9]}
}
```
**Expected:**
- UI blocks run with error: `❌ Cannot run: Missing required parameters\n\nMissing required parameter: target`
- Run button disabled
- Error shown in red panel

### ✅ Test 4: Param Normalization (array → arr)
```json
{
  "topic": "bubblesort",
  "mode": "trace",
  "lang": "de",
  "params": {"array": [5, 2, 8, 1]}
}
```
**Expected:**
- Auto-converts `array` to `arr` before sending
- Log shows: `[UPDATE] Normalized 'array' → 'arr'`
- Request succeeds

### ✅ Test 5: Binary Search with Target
```json
{
  "topic": "binarysearch",
  "mode": "pseudocode",
  "lang": "de",
  "params": {"arr": [1, 3, 5, 7, 9, 11], "target": 7}
}
```
**Expected:**
- Succeeds
- Shows pseudocode
- No validation errors

### ✅ Test 6: Request Preview
**Steps:**
1. Select topic, mode, lang, params
2. Click "Request Preview" accordion

**Expected:**
- Shows EXACT JSON that will be sent
- Mode is core mode (e.g., "trace" not "trace_learn")
- Params are normalized (arr, not array)

### ✅ Test 7: Raw Response Tab
**Steps:**
1. Run any request successfully
2. Switch to "Raw" tab

**Expected:**
- Shows full JSON response with pretty formatting
- Includes all fields: result, events, questions, stats, etc.

### ✅ Test 8: Logs Tab
**Steps:**
1. Run any request
2. Switch to "Logs" tab

**Expected:**
- Shows timestamped log entries:
  - `REQUEST: topic=X mode=Y lang=Z`
  - `PARAMS: arr, target`
  - `INVOKE_START`
  - `INVOKE_DONE len=1234`
  - `PARSE_OK keys=result,events,questions,stats`
  - `RESULT_KEYS: explain, algorithm, sorted`

## Manual Testing Checklist

### UI Testing
- [ ] Persian text displays correctly (not mojibake)
- [ ] Line breaks preserved in explanations
- [ ] Font is readable for both Latin and Persian
- [ ] Error messages are clear and actionable

### Functionality Testing
- [ ] All 8 test scenarios pass
- [ ] Request preview matches actual request
- [ ] Logs show all diagnostic info
- [ ] Raw tab shows full response

### Edge Cases
- [ ] Empty params: Shows validation error
- [ ] Invalid JSON: Shows parse error
- [ ] Missing target for binarysearch: Blocked
- [ ] selectionsort with "array" param: Auto-normalized

### Performance
- [ ] No UI lag when rendering long Persian text
- [ ] Logs don't overflow (ring buffer)
- [ ] Tab switching is instant

## Regression Testing

Ensure these still work:
- [ ] Pseudocode mode shows code block
- [ ] Trace mode shows events table
- [ ] Quiz mode shows questions
- [ ] Stats mode shows statistics
- [ ] Self-test runs 3 requests

## Known Limitations

1. **No RTL layout**: Persian text is LTR (can be fixed with CSS `direction: rtl`)
2. **Font fallback**: System fonts used (could add specific Persian font)
3. **No translation**: UI labels still in English/German
4. **Manual normalization**: Only array/arr and num_questions/numq (could be extended)

## Next Steps

If issues found:
1. Check Logs tab for diagnostic info
2. Check Raw tab for actual response
3. Verify Request Preview shows correct JSON
4. Check browser DevTools console for errors

## Files Changed

1. `src/components/renderers.tsx` (46 lines) - Fix explain rendering
2. `src/state/update.ts` (32 lines) - Param normalization + logging
3. `src/app/runtime.ts` (7 lines) - Result keys logging
4. `src/views/PracticePage.tsx` (1 line) - Remove unused import

**Total:** 4 files, 86 lines changed

## Commit Info

Branch: `feature/topic-registry`
Commit: `a1183a4`
Message: "fix: Persian explanations and param normalization"
