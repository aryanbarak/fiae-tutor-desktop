# Parameter Validation System - Implementation Documentation

## Overview

A schema-driven parameter validation system that prevents runtime errors by validating and normalizing parameters BEFORE calling the Python core. This system ensures that Practice and Explain modes run reliably without missing required parameters.

## Architecture

### 1. Schema Layer (`paramSchema.ts`)

Defines the canonical parameter structure for each topic:

```typescript
interface ParamDefinition {
  key: string;           // Canonical key name
  labelDe: string;       // German label
  labelFa: string;       // Persian/Farsi label
  type: "array" | "number" | "string";
  aliases?: string[];    // Alternative names (e.g., "array" for "arr")
}

interface ModeDefaults {
  [mode: string]: Record<string, any>;
}
```

**Key Features:**
- **Bilingual labels**: Ready for German/Farsi UI
- **Type definitions**: array, number, string
- **Alias support**: Handles `arr` ↔ `array` inconsistencies
- **Mode-specific defaults**: Different defaults per mode (trace, explain, etc.)

**Example Schema:**
```typescript
binarysearch: {
  params: [
    { key: "arr", labelDe: "Array (sortiert)", labelFa: "آرایه (مرتب شده)", type: "array", aliases: ["array"] },
    { key: "target", labelDe: "Zielwert", labelFa: "هدف", type: "number" },
  ],
  modeDefaults: {
    trace: { arr: [1, 3, 5, 7, 9, 11], target: 7 },
    trace_exam: { arr: [1, 3, 5, 7, 9, 11], target: 7 },
    pseudocode: { arr: [1, 3, 5, 7, 9, 11], target: 7 },
    explain: { arr: [1, 3, 5, 7, 9, 11], target: 7 },
  },
}
```

### 2. Validation Layer (`paramValidator.ts`)

Implements comprehensive validation and normalization:

#### `normalizeAndValidateParams()`

**Process:**
1. **Normalize keys**: Convert aliases to canonical form (`array` → `arr`)
2. **Merge defaults**: Combine mode defaults with user values (user takes precedence)
3. **Validate required**: Check all required params exist
4. **Validate types**: Ensure correct types (array, number, string)
5. **Check emptiness**: Reject empty arrays, null/undefined values
6. **Mode compatibility**: Warn if mode not allowed for topic

**Returns:**
```typescript
{
  ok: boolean;                    // true if no errors
  normalizedParams: Record<string, any>;  // Params with canonical keys
  errors: string[];               // Validation errors
  warnings: string[];             // Non-critical warnings
}
```

**Example:**
```typescript
// Input: { "array": [1, 2], "target": 5 }  // Wrong key name
// Topic: binarysearch
// Output:
{
  ok: true,
  normalizedParams: { arr: [1, 2], target: 5 },  // Normalized to "arr"
  errors: [],
  warnings: []
}
```

#### `autoPopulateParams()`

Auto-fills parameters when topic or mode changes while preserving user data:

```typescript
// Current params: { arr: [99, 88, 77] }
// Switch topic: bubblesort → insertionsort
// Result: { arr: [99, 88, 77] }  // User data preserved!

// Current params: { arr: [1, 2] }  // Missing "target"
// Switch topic: bubblesort → binarysearch
// Result: { arr: [1, 2], target: 7 }  // Merged with defaults
```

### 3. State Management Layer (`update.ts`)

Integrates validation into MVU pattern:

#### Topic Changed
```typescript
case "PracticeTopicChanged": {
  // 1. Parse current params (if valid JSON)
  // 2. Auto-populate with new topic's mode defaults
  // 3. Validate populated params
  // 4. Update state with validation result
}
```

#### Mode Changed
```typescript
case "PracticeModeChanged": {
  // 1. Parse current params
  // 2. Auto-populate with mode-specific defaults
  // 3. Validate
  // 4. Update state
}
```

#### Params Edited
```typescript
case "PracticeParamsChanged": {
  // 1. Check JSON syntax
  // 2. Validate with schema
  // 3. Update state with errors (if any)
}
```

#### Run Requested
```typescript
case "PracticeRunRequested": {
  // 1. Parse params JSON
  // 2. Validate mode allowed for topic
  // 3. Normalize and validate params
  // 4. BLOCK if errors found
  // 5. Send normalized params to core
}
```

### 4. UI Layer

#### PracticePage
- Shows inline validation errors below params editor
- Disables Run button when `hasErrors = !paramsValid || paramsErrors.length > 0`
- Error badge on params toggle button
- Red border on params textarea when errors present

#### ExplainSidebar
- Same validation UI as PracticePage
- Compact layout for reader mode
- Error badge and disabled Run button

## Parameter Normalization

### Alias Mapping

The system handles inconsistent parameter names across topics:

| Topic | Expects | Alias | Direction |
|-------|---------|-------|-----------|
| bubblesort | `arr` | `array` → `arr` | Standard |
| insertionsort | `arr` | `array` → `arr` | Standard |
| selectionsort | `array` | `arr` → `array` | **Reverse!** |
| binarysearch | `arr` | `array` → `arr` | Standard |

**Why this matters:**
- User can type either `arr` or `array`
- System auto-normalizes to canonical form
- Python core receives correct key names

### Type Validation

```typescript
// Array validation
{ arr: [] }  // ❌ Error: "array cannot be empty"
{ arr: "not-array" }  // ❌ Error: "must be an array"

// Number validation
{ target: "abc" }  // ❌ Error: "must be a number"
{ target: NaN }  // ❌ Error: "must be a number"

// String validation
{ case: 123 }  // ❌ Error: "must be a string"
```

## Error Messages

### JSON Syntax Errors
```
❌ JSON syntax error: Unexpected token } in JSON at position 15
```

### Missing Required Params
```
❌ Missing required parameter: target
```

### Empty Arrays
```
❌ Parameter 'arr' array cannot be empty
```

### Type Mismatches
```
❌ Parameter 'target' must be a number, got: string
```

### Multiple Errors
```
Parameter validation failed:
3 validation errors:
• Missing required parameter: target
• Parameter 'arr' array cannot be empty
• Parameter 'case' must be a string, got: number
```

## Mode-Specific Defaults

Each topic can have different defaults per mode:

```typescript
binarysearch: {
  modeDefaults: {
    trace: { arr: [1, 3, 5, 7, 9, 11], target: 7 },      // Full example
    trace_exam: { arr: [1, 3, 5, 7, 9, 11], target: 7 }, // Same as trace
    pseudocode: { arr: [1, 3, 5, 7, 9, 11], target: 7 }, // Algorithm demo
    explain: { arr: [1, 3, 5, 7, 9, 11], target: 7 },    // Teaching example
    quiz: { arr: [2, 4, 6, 8, 10], target: 6 },          // Different for quiz
  },
}
```

## User Data Preservation

When switching topics/modes, the system intelligently merges:

### Scenario 1: Matching Keys
```typescript
// Current topic: bubblesort
// Params: { arr: [99, 88, 77] }  // User edited
// Switch to: insertionsort
// Result: { arr: [99, 88, 77] }  // Preserved!
```

### Scenario 2: New Required Keys
```typescript
// Current topic: bubblesort
// Params: { arr: [1, 2, 3] }
// Switch to: binarysearch (requires arr + target)
// Result: { arr: [1, 2, 3], target: 7 }  // Merged: user arr + default target
```

### Scenario 3: Incompatible Keys
```typescript
// Current topic: binarysearch
// Params: { arr: [1, 2], target: 5 }
// Switch to: checksum (requires case, code, weights)
// Result: { case: "compute", code: "12345", weights: [2, 1, 2, 1, 2] }
// (No matching keys, use full defaults)
```

## Testing Strategy

### Manual Testing
See `VALIDATION_TEST_GUIDE.md` for comprehensive test cases covering:
- Auto-population on topic/mode change
- Array vs arr normalization
- Missing required params
- Empty arrays
- Type validation
- JSON syntax errors
- User data preservation

### Unit Testing (Future)
Recommended tests for `paramValidator.ts`:
```typescript
describe("normalizeAndValidateParams", () => {
  it("normalizes array → arr for bubblesort")
  it("normalizes arr → array for selectionsort")
  it("rejects missing required params")
  it("rejects empty arrays")
  it("rejects wrong types")
  it("preserves extra params")
});

describe("autoPopulateParams", () => {
  it("preserves matching user values")
  it("adds missing required params")
  it("uses mode-specific defaults")
});
```

## Benefits

### For Users
- ✅ Run button disabled when params invalid → prevents confusion
- ✅ Inline errors show exactly what's wrong → faster debugging
- ✅ Auto-population saves typing → better UX
- ✅ User edits preserved when switching topics → data not lost

### For Developers
- ✅ Single source of truth in `PARAM_SCHEMAS` → easy to maintain
- ✅ No core calls with invalid params → fewer runtime errors
- ✅ Type-safe validation → catches errors early
- ✅ Bilingual labels ready → future i18n support

### For Reliability
- ✅ Validation before Tauri call → prevents IPC errors
- ✅ Normalization handles aliases → consistent core input
- ✅ Mode validation → only allowed modes run
- ✅ Comprehensive error messages → easy to diagnose issues

## Future Enhancements

### Short-term
- [ ] Add visual param editor (dropdowns, number inputs) instead of raw JSON
- [ ] Show param labels in UI (German/Farsi based on lang setting)
- [ ] Add tooltips with param descriptions
- [ ] Highlight invalid params in JSON editor

### Long-term
- [ ] Generate TypeScript types from schemas
- [ ] Add param constraints (min/max, regex patterns)
- [ ] Support nested params and complex types
- [ ] Add schema versioning for backward compatibility

## Migration from Old System

### Before
```typescript
// Old topicRegistry.ts
requiredParams: ["arr", "target"]
defaultParams: { arr: [1, 3, 5], target: 7 }
```

### After
```typescript
// New paramSchema.ts
params: [
  { key: "arr", labelDe: "Array", labelFa: "آرایه", type: "array", aliases: ["array"] },
  { key: "target", labelDe: "Zielwert", labelFa: "هدف", type: "number" },
],
modeDefaults: {
  trace: { arr: [1, 3, 5], target: 7 },
  explain: { arr: [1, 3, 5], target: 7 },
}
```

### Compatibility
- Old `topicRegistry.ts` still used for:
  - Topic labels and descriptions
  - Allowed modes per topic
  - Legacy `validateTopicParams()` (kept for backward compatibility)
- New `paramSchema.ts` used for:
  - Detailed param definitions
  - Mode-specific defaults
  - Normalization and validation

## API Reference

### paramSchema.ts

```typescript
getModeDefaults(topicId: TopicId, mode: CoreMode): Record<string, any>
getParamLabel(topicId: TopicId, paramKey: string, lang: "de" | "fa"): string
normalizeParamKeys(topicId: TopicId, params: Record<string, any>): Record<string, any>
```

### paramValidator.ts

```typescript
normalizeAndValidateParams(
  topicId: TopicId,
  mode: CoreMode,
  userParams: Record<string, any>
): ValidationResult

autoPopulateParams(
  topicId: TopicId,
  mode: CoreMode,
  currentParams: Record<string, any>
): Record<string, any>

formatValidationErrors(errors: string[]): string
```

## Troubleshooting

### "Missing required parameter: X"
- Check schema defines X as required
- Ensure defaultParams includes X
- Verify JSON syntax is correct

### "Parameter 'X' must be a Y, got: Z"
- Check param type in schema
- Ensure JSON value matches type
- For numbers, remove quotes: `7` not `"7"`

### "Parameter 'arr' array cannot be empty"
- Provide at least one element: `[1]`
- Check defaults have non-empty arrays

### Run button stays disabled
- Check browser console for validation errors
- Verify params editor shows green/no errors
- Try resetting to defaults (change topic and back)

## Summary

The parameter validation system provides a robust, schema-driven approach to ensuring data quality before core invocation. It prevents runtime errors, improves UX through auto-population and inline feedback, and establishes a foundation for future enhancements like visual param editors and internationalization.
