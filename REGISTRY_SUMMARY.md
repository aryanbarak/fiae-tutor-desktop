# Topic Registry System - Complete Implementation Summary

## Executive Summary
Fixed "some topics work, some fail" by implementing strict Topic Registry that enforces valid mode/topic combinations and parameter requirements.

## Root Cause Analysis
1. **Mode Mismatch**: UI sent `"trace_learn"` but core only accepts `"trace"`
2. **No Mode Validation**: UI allowed any mode for any topic (e.g., quiz mode for search_contains)
3. **No Param Validation**: Missing required params (target, case) caused runtime errors
4. **Inconsistent Naming**: selectionsort uses "array", others use "arr"

## Solution Components

### 1. Topic Registry (`src/domain/topicRegistry.ts`)
- 10 topics with `allowedModes`, `requiredParams`, `defaultParams`
- `CoreMode` type excludes `"trace_learn"` (UI-only)
- Validation functions: `validateTopicParams()`, `isModeAllowed()`

### 2. Mode Mapper (`src/domain/modeMap.ts`)
- Maps `"trace_learn"` (UI) → `"trace"` (Core)
- `toCoreMode()` handles conversion
- `getModeLabel()` for display names

### 3. State & Update
- **model.ts**: Uses `UiMode` (allows trace_learn in UI)
- **update.ts**: 
  - Topic change → auto-reset mode if not allowed
  - Mode change → validate against allowed modes
  - Run → map UI mode to core mode before sending

### 4. UI (`PracticePage.tsx`)
- Dynamic mode dropdown (only shows allowed modes)
- Request preview shows core mode
- Topic labels from registry

## Test Matrix

| Topic | Mode | Params | Expected |
|-------|------|--------|----------|
| bubblesort | pseudocode | `{"arr": [5,2,8,1]}` | ✅ Success |
| binarysearch | pseudocode | `{"arr": [1,3,5,7,9], "target": 7}` | ✅ Success |
| search_contains | trace_exam | `{"case": "contains", "arr": [1,3,5,7,9], "target": 7}` | ✅ Success |
| search_contains | quiz | - | ❌ Mode not in dropdown |
| binarysearch | pseudocode | `{"arr": [1,3,5,7,9]}` | ❌ Missing target error |

## Files Modified
- ✅ Created: `topicRegistry.ts`, `modeMap.ts`
- ✅ Updated: `model.ts`, `actions.ts`, `update.ts`, `PracticePage.tsx`
- ⚠️ Deprecated: `topicSpec.ts`, `topics.ts`, `presets.ts`

## Success Criteria
- ✅ No "unknown mode" errors
- ✅ Invalid mode/topic combos blocked
- ✅ Missing params caught before Run
- ✅ Request preview shows core modes
- ✅ All 10 topics runnable
