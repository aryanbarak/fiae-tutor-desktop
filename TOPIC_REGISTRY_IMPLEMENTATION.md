# Topic Registry Implementation - Testing Checklist

## Overview
This document describes the strict Topic Registry system implemented to fix the "some topics work, some fail" problem.

## Key Changes

### 1. Topic Registry (`src/domain/topicRegistry.ts`)
- **CoreMode**: Strict union of core-accepted modes: `"trace" | "trace_exam" | "quiz" | "pseudocode" | "explain" | "debug"`
- **Removed**: `"trace_learn"` from core modes (UI-only legacy mode)
- **Per-topic config**: Each topic defines `allowedModes`, `requiredParams`, `defaultParams`
- **Validation**: `validateTopicParams()` checks required params exist and are non-empty

### 2. Mode Mapping (`src/domain/modeMap.ts`)
- **UiMode**: UI can show `"trace_learn"` for backwards compat
- **toCoreMode()**: Maps `"trace_learn"` → `"trace"` before sending to core
- **getModeLabel()**: User-friendly display names

### 3. State & Update (`src/state/`)
- **model.ts**: Uses `UiMode` for state (allows trace_learn in UI)
- **update.ts**: 
  - When topic changes, auto-resets mode to first allowed mode if current not allowed
  - When mode changes, validates against allowed modes for topic
  - **PracticeRunRequested**: Maps UI mode to core mode before sending request

### 4. UI (`src/views/PracticePage.tsx`)
- **Dynamic mode dropdown**: Only shows allowed modes for current topic
- **Topic labels**: Shows friendly names from registry
- **Request preview**: Shows core mode (not UI mode) in JSON preview

## Test Matrix

### ✅ Should Work (after fix)
| Topic | Mode | Params | Expected |
|-------|------|--------|----------|
| bubblesort | pseudocode | `{"arr": [5,2,8,1]}` | ✅ Show pseudocode |
| bubblesort | trace_exam | `{"arr": [5,2,8,1]}` | ✅ Show trace (exam mode) |
| binarysearch | pseudocode | `{"arr": [1,3,5,7,9], "target": 7}` | ✅ Show pseudocode |
| search_contains | trace_exam | `{"case": "contains", "arr": [1,3,5,7,9], "target": 7}` | ✅ Show trace (exam) |
| selectionsort | trace_learn | `{"array": [5,2,8,1]}` | ✅ Maps to "trace" core mode |

### ❌ Should Block (client-side validation)
| Topic | Mode | Params | Expected Error |
|-------|------|--------|----------------|
| search_contains | trace_exam | `{"case": "contains", "arr": [1,3,5,7,9]}` | ❌ Missing required parameter: target |
| binarysearch | pseudocode | `{"arr": [1,3,5,7,9]}` | ❌ Missing required parameter: target |
| bubblesort | debug | - | ❌ Mode 'debug' not in dropdown (not allowed for bubblesort) |
| selectionsort | quiz | `{"arr": [5,2,8,1]}` | ❌ Parameter name should be "array" not "arr" |

## Key Features

### 1. Mode Filtering
- **Before**: All modes shown for all topics
- **After**: Only allowed modes shown in dropdown for current topic
- **Example**: search_contains only shows: trace, trace_exam, explain (no quiz/pseudocode)

### 2. Mode Mapping
- **trace_learn** (UI) → **trace** (Core)
- Request preview shows core mode
- Python CLI receives correct mode

### 3. Param Normalization
- **selectionsort**: Uses "array" not "arr"
- **Registry**: Defines correct param names per topic
- **Validation**: Checks required params exist before Run

### 4. Auto-Correction
- When topic changes, if current mode not allowed → reset to first allowed mode
- Example: If on "debug" mode, switch to "search_contains" → auto-resets to "trace"

### 5. Error Messages
- **JSON syntax errors**: Show immediately on params change
- **Missing required params**: Show before Run, block execution
- **Invalid mode**: Prevented by UI (mode not in dropdown)

## Implementation Files

### Core Files
- **topicRegistry.ts**: 10 topics × allowedModes + requiredParams + defaults
- **modeMap.ts**: UI mode → Core mode conversion
- **model.ts**: State uses UiMode
- **update.ts**: Validates mode compatibility, maps to core mode
- **PracticePage.tsx**: Dynamic mode dropdown, shows allowed modes only

### Topic Registry Structure
```typescript
{
  id: "binarysearch",
  label: "Binary Search",
  description: "Search for target in sorted array using binary search",
  allowedModes: ["pseudocode", "trace", "trace_exam", "explain", "quiz"],
  requiredParams: ["arr", "target"],
  defaultParams: { arr: [1, 3, 5, 7, 9, 11], target: 7 }
}
```

## Self-Test
Self-test command runs 3 test cases:
1. BubbleSort Pseudocode
2. BinarySearch Pseudocode
3. SearchContains Trace Exam

All use **core modes** ("pseudocode", "trace_exam") - no UI modes.

## Backward Compatibility
- UI can still show "Trace (Learn)" option
- Gets mapped to "trace" when sent to core
- No breaking changes to existing UI

## Error Prevention
- **Black screens**: Error Boundary already in place
- **Invalid mode**: Blocked by dropdown filtering
- **Missing params**: Blocked by client-side validation
- **Wrong param names**: Registry defines correct names (e.g., "array" for selectionsort)

## Next Steps (Manual Testing)
1. ✅ Start app
2. ✅ Select "bubblesort" → verify mode dropdown shows: explain, pseudocode, trace_learn, trace_exam, quiz
3. ✅ Select "search_contains" → verify mode dropdown shows: explain, trace, trace_exam (no quiz/pseudocode)
4. ✅ Try to run search_contains without "target" param → verify error shown
5. ✅ Check Request Preview shows core mode ("trace" not "trace_learn")
6. ✅ Run self-test → all 3 requests should succeed

## Bug Fixes
### Issue #1: trace_learn not recognized by core
- **Root cause**: UI sent "trace_learn" mode to Python CLI, which only accepts "trace"
- **Fix**: `toCoreMode()` maps trace_learn → trace before sending request

### Issue #2: Some modes don't work for some topics
- **Root cause**: No enforcement of allowed mode/topic combinations
- **Fix**: Topic Registry defines `allowedModes` per topic, UI filters dropdown

### Issue #3: Missing params cause black screen
- **Root cause**: No client-side validation before Run
- **Fix**: `validateTopicParams()` checks required params, blocks Run if errors

### Issue #4: selectionsort uses "array" not "arr"
- **Root cause**: Inconsistent param naming in core
- **Fix**: Registry defines correct param name per topic

## Migration Notes
- **Old files**: `topicSpec.ts`, `topics.ts`, `presets.ts` can be archived (replaced by topicRegistry.ts)
- **Type changes**: `ModeId` → `UiMode` (state), `CoreMode` (requests)
- **No runtime changes**: Python CLI unchanged, just receives correct modes now
