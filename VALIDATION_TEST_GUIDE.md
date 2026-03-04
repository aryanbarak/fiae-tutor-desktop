# Parameter Validation System - Test Guide

## Overview
This document tests the new schema-driven parameter validation system that prevents core errors by validating and normalizing parameters BEFORE calling the Python core.

## Implementation Summary

### Files Created
1. **src/domain/paramSchema.ts** - Parameter schema definitions
   - `PARAM_SCHEMAS`: Complete schema for all 10 topics with:
     - `params`: Array of ParamDefinition (key, labelDe, labelFa, type, aliases)
     - `modeDefaults`: Mode-specific defaults (trace, trace_exam, pseudocode, explain, quiz)
   - `getModeDefaults()`: Get defaults for topic+mode combination
   - `getParamLabel()`: Get bilingual labels (de/fa)
   - `normalizeParamKeys()`: Handle arr vs array aliases

2. **src/domain/paramValidator.ts** - Validation logic
   - `normalizeAndValidateParams()`: Comprehensive validation with:
     - Key normalization (arr ↔ array)
     - Merge with mode defaults
     - Required param validation
     - Type checking (array, number, string)
     - Returns: { ok, normalizedParams, errors, warnings }
   - `autoPopulateParams()`: Auto-fill params when topic/mode changes
   - `formatValidationErrors()`: User-friendly error messages

3. **src/state/update.ts** - Enhanced state management
   - `PracticeTopicChanged`: Auto-populate params, preserve user data
   - `PracticeModeChanged`: Auto-populate mode-specific defaults
   - `PracticeParamsChanged`: Validate on every edit
   - `PracticeRunRequested`: Block run if params invalid, use normalized params

4. **src/views/explain/ExplainSidebar.tsx** - Enhanced UI
   - Added `paramsValid` and `paramsErrors` props
   - Inline validation error display
   - Error badge on params toggle button
   - Disabled Run button when errors present

5. **src/views/explain/ExplainPage.tsx** - Updated to pass validation state

## Testing Checklist

### ✅ Test 1: Auto-Population on Topic Change
**Steps:**
1. Open app
2. Select topic: `bubblesort`
3. Check params editor

**Expected:**
- Params auto-populated with: `{ "arr": [64, 25, 12, 22, 11] }`
- No validation errors
- Run button enabled

**Actual:**
- [ ] Passed
- [ ] Failed (describe issue)

---

### ✅ Test 2: Auto-Population on Mode Change
**Steps:**
1. Topic: `bubblesort`
2. Mode: `Trace (Learn)`
3. Switch to: `Explain`
4. Check params

**Expected:**
- Params remain: `{ "arr": [64, 25, 12, 22, 11] }`
- No validation errors
- Run button enabled

**Actual:**
- [ ] Passed
- [ ] Failed (describe issue)

---

### ✅ Test 3: Array vs Arr Normalization (selectionsort)
**Steps:**
1. Select topic: `selectionsort` (expects "array" not "arr")
2. Check params editor

**Expected:**
- Params show: `{ "array": [64, 25, 12, 22, 11] }`
- No errors (canonical key is "array")
- Run button enabled

**Actual:**
- [ ] Passed
- [ ] Failed (describe issue)

---

### ✅ Test 4: Multiple Required Params (binarysearch)
**Steps:**
1. Select topic: `binarysearch` (requires arr + target)
2. Check params

**Expected:**
- Params: `{ "arr": [1, 3, 5, 7, 9, 11], "target": 7 }`
- No errors
- Run button enabled

**Actual:**
- [ ] Passed
- [ ] Failed (describe issue)

---

### ✅ Test 5: Missing Required Param Error
**Steps:**
1. Topic: `binarysearch`
2. Edit params to remove "target": `{ "arr": [1, 3, 5, 7, 9] }`
3. Check validation

**Expected:**
- Error shown: "❌ Missing required parameter: target"
- Run button DISABLED
- Error badge on params toggle

**Actual:**
- [ ] Passed
- [ ] Failed (describe issue)

---

### ✅ Test 6: Empty Array Error
**Steps:**
1. Topic: `bubblesort`
2. Edit params: `{ "arr": [] }`
3. Check validation

**Expected:**
- Error: "❌ Parameter 'arr' array cannot be empty"
- Run button DISABLED

**Actual:**
- [ ] Passed
- [ ] Failed (describe issue)

---

### ✅ Test 7: Type Validation (target not a number)
**Steps:**
1. Topic: `binarysearch`
2. Edit params: `{ "arr": [1, 3, 5], "target": "abc" }`
3. Check validation

**Expected:**
- Error: "❌ Parameter 'target' must be a number, got: string"
- Run button DISABLED

**Actual:**
- [ ] Passed
- [ ] Failed (describe issue)

---

### ✅ Test 8: JSON Syntax Error
**Steps:**
1. Topic: `bubblesort`
2. Edit params with invalid JSON: `{ arr: [1, 2 }`
3. Check validation

**Expected:**
- Error: "❌ JSON syntax error: ..."
- Run button DISABLED

**Actual:**
- [ ] Passed
- [ ] Failed (describe issue)

---

### ✅ Test 9: User Data Preservation on Topic Switch
**Steps:**
1. Topic: `bubblesort`
2. Edit params: `{ "arr": [99, 88, 77] }`
3. Switch to: `insertionsort`
4. Check params

**Expected:**
- Params preserved: `{ "arr": [99, 88, 77] }` (user data kept)
- No errors
- Run button enabled

**Actual:**
- [ ] Passed
- [ ] Failed (describe issue)

---

### ✅ Test 10: Complex Topic (search_contains)
**Steps:**
1. Select topic: `search_contains` (requires case, arr, target)
2. Check params

**Expected:**
- Params: `{ "case": "contains", "variant": "int_asc", "arr": [1, 3, 5, 7, 9], "target": 7 }`
- No errors
- Run button enabled

**Actual:**
- [ ] Passed
- [ ] Failed (describe issue)

---

### ✅ Test 11: Explain Mode Validation
**Steps:**
1. Switch to Explain Mode
2. Select topic: `binarysearch`
3. Remove "target" from params
4. Try to run

**Expected:**
- Error shown in sidebar
- Run button DISABLED
- Error badge visible

**Actual:**
- [ ] Passed
- [ ] Failed (describe issue)

---

### ✅ Test 12: Successful Run After Fixing Errors
**Steps:**
1. Topic: `binarysearch`
2. Remove "target": `{ "arr": [1, 3, 5] }`
3. See error
4. Add back "target": `{ "arr": [1, 3, 5], "target": 3 }`
5. Click Run

**Expected:**
- Errors clear
- Run button becomes enabled
- Core executes successfully
- Output displays result

**Actual:**
- [ ] Passed
- [ ] Failed (describe issue)

---

## Validation Rules Reference

### By Topic

#### bubblesort, insertionsort
- Required: `arr` (array)
- Aliases: `array` → `arr`
- Type: Array of numbers
- Default: `[64, 25, 12, 22, 11]`

#### selectionsort
- Required: `array` (array)
- Aliases: `arr` → `array` (reverse!)
- Type: Array of numbers
- Default: `[64, 25, 12, 22, 11]`

#### binarysearch
- Required: `arr` (array), `target` (number)
- Aliases: `array` → `arr`
- Type: Sorted array + number
- Default: `{ arr: [1, 3, 5, 7, 9, 11], target: 7 }`

#### search_contains
- Required: `case` (string), `arr` (array), `target` (number)
- Default: `{ case: "contains", variant: "int_asc", arr: [1, 3, 5, 7, 9], target: 7 }`

#### count_condition
- Required: `arr` (array), `threshold` (number), `case` (string)
- Default: `{ arr: [1, 5, 7, 2, 9], threshold: 4, case: "count_gt" }`

#### checksum
- Required: `case` (string), `code` (string), `weights` (array)
- Default: `{ case: "compute", code: "12345", weights: [2, 1, 2, 1, 2] }`

## Known Issues
- None currently

## Notes
- The validation runs BEFORE the Tauri command is invoked
- Normalized params are sent to Python core (handles arr/array automatically)
- User data is preserved when switching between topics with matching keys
- Mode-specific defaults ensure correct examples for each mode
- Bilingual labels ready for future UI enhancements
