# Parameter Validation - Quick Reference

## Quick Start

### Adding a New Topic

1. **Add schema to `paramSchema.ts`:**
```typescript
mytopic: {
  params: [
    { key: "arr", labelDe: "Array", labelFa: "آرایه", type: "array", aliases: ["array"] },
    { key: "value", labelDe: "Wert", labelFa: "مقدار", type: "number" },
  ],
  modeDefaults: {
    trace: { arr: [1, 2, 3], value: 5 },
    explain: { arr: [1, 2, 3], value: 5 },
  },
}
```

2. **Add to `topicRegistry.ts`:**
```typescript
mytopic: {
  label: "My Topic",
  description: "Description...",
  requiredParams: ["arr", "value"],
  defaultParams: { arr: [1, 2, 3], value: 5 },
  allowedModes: ["trace", "explain"],
}
```

That's it! Validation works automatically.

## Param Types

### Array
```typescript
{ key: "arr", type: "array" }
// Valid: [1, 2, 3]
// Invalid: [], "not-array", null
```

### Number
```typescript
{ key: "count", type: "number" }
// Valid: 42, 0, -5
// Invalid: "42", NaN, null
```

### String
```typescript
{ key: "case", type: "string" }
// Valid: "contains", "compute"
// Invalid: 123, null
```

## Aliases

### Standard (arr with array alias)
```typescript
{ key: "arr", aliases: ["array"] }
// User types: { "array": [1, 2] }
// Normalized to: { "arr": [1, 2] }
```

### Reverse (array with arr alias)
```typescript
{ key: "array", aliases: ["arr"] }  // selectionsort uses this
// User types: { "arr": [1, 2] }
// Normalized to: { "array": [1, 2] }
```

## Mode Defaults

### Same defaults for all modes
```typescript
modeDefaults: {
  trace: { arr: [1, 2, 3] },
  trace_exam: { arr: [1, 2, 3] },
  explain: { arr: [1, 2, 3] },
}
```

### Different defaults per mode
```typescript
modeDefaults: {
  trace: { arr: [1, 2, 3, 4, 5] },      // Full example
  trace_exam: { arr: [1, 2, 3, 4, 5] }, // Same
  explain: { arr: [1, 2, 3] },          // Simpler for teaching
  quiz: { arr: [2, 4, 6] },             // Different for quiz
}
```

## Validation Flow

```
1. User edits params
   ↓
2. JSON.parse()
   ↓
3. normalizeParamKeys() → arr/array fixed
   ↓
4. Merge with mode defaults
   ↓
5. Check required params exist
   ↓
6. Check types (array, number, string)
   ↓
7. Check non-empty (arrays, values)
   ↓
8. Return: { ok, normalizedParams, errors, warnings }
```

## Common Errors

### Missing Required Parameter
```
Error: ❌ Missing required parameter: target
Fix: Add { "target": 7 }
```

### Empty Array
```
Error: ❌ Parameter 'arr' array cannot be empty
Fix: Change [] to [1, 2, 3]
```

### Wrong Type
```
Error: ❌ Parameter 'target' must be a number, got: string
Fix: Change "7" to 7 (remove quotes)
```

### JSON Syntax Error
```
Error: ❌ JSON syntax error: Unexpected token }
Fix: Check for missing commas, quotes, brackets
```

## UI Indicators

### Valid Params
- ✅ No errors shown
- ✅ Run button enabled
- ✅ Params editor has normal border

### Invalid Params
- ❌ Errors shown below params editor
- ❌ Run button **disabled**
- ❌ Params editor has **red border**
- ❌ Error badge (⚠️) on params toggle

## Testing

### Manual Test
1. Select topic: `binarysearch`
2. Remove "target" from params
3. Verify: Error shown, Run disabled
4. Add back "target"
5. Verify: Error clears, Run enabled
6. Click Run
7. Verify: Core executes successfully

### Automated Test (Future)
```typescript
describe("paramValidator", () => {
  it("normalizes array → arr", () => {
    const result = normalizeParamKeys("bubblesort", { array: [1, 2] });
    expect(result).toEqual({ arr: [1, 2] });
  });
});
```

## Troubleshooting

### Run button disabled but no errors shown
- Check browser console for validation errors
- Try refreshing the page
- Reset params (change topic and back)

### Params not auto-populating
- Check `modeDefaults` in paramSchema.ts
- Verify mode is in modeDefaults object
- Check browser console for errors

### Normalization not working
- Check `aliases` in paramSchema.ts
- Verify canonical key is correct
- Test with both `arr` and `array`

## API Reference

### normalizeAndValidateParams()
```typescript
normalizeAndValidateParams(
  topicId: "bubblesort",
  mode: "trace",
  userParams: { array: [1, 2] }  // Wrong key
)
// Returns:
{
  ok: true,
  normalizedParams: { arr: [1, 2] },  // Normalized!
  errors: [],
  warnings: []
}
```

### autoPopulateParams()
```typescript
autoPopulateParams(
  topicId: "binarysearch",
  mode: "trace",
  currentParams: { arr: [99] }  // User edited
)
// Returns:
{
  arr: [99],      // User value preserved
  target: 7       // Default added
}
```

## Best Practices

### ✅ DO
- Use canonical keys in schema (`arr` for most topics)
- Provide mode-specific defaults when needed
- Add bilingual labels (de/fa)
- Test with empty arrays, wrong types

### ❌ DON'T
- Mix arr and array in same schema
- Forget to add to both paramSchema and topicRegistry
- Use string "7" instead of number 7 in defaults
- Leave mode defaults empty

## Examples by Topic

### Simple (bubblesort)
```typescript
params: [
  { key: "arr", type: "array", aliases: ["array"] }
],
modeDefaults: {
  trace: { arr: [64, 25, 12, 22, 11] }
}
```

### Multi-param (binarysearch)
```typescript
params: [
  { key: "arr", type: "array", aliases: ["array"] },
  { key: "target", type: "number" }
],
modeDefaults: {
  trace: { arr: [1, 3, 5, 7, 9], target: 7 }
}
```

### Complex (search_contains)
```typescript
params: [
  { key: "case", type: "string" },
  { key: "arr", type: "array", aliases: ["array"] },
  { key: "target", type: "number" }
],
modeDefaults: {
  trace: { 
    case: "contains", 
    variant: "int_asc", 
    arr: [1, 3, 5, 7, 9], 
    target: 7 
  }
}
```

## Cheat Sheet

| Task | File | Function |
|------|------|----------|
| Add new topic | `paramSchema.ts` | Add to `PARAM_SCHEMAS` |
| Change defaults | `paramSchema.ts` | Update `modeDefaults` |
| Add alias | `paramSchema.ts` | Add to `aliases` array |
| Debug validation | Browser console | Check validation logs |
| Test manually | Browser | See `VALIDATION_TEST_GUIDE.md` |

## Links

- **Full docs**: [VALIDATION_SYSTEM.md](./VALIDATION_SYSTEM.md)
- **Test guide**: [VALIDATION_TEST_GUIDE.md](./VALIDATION_TEST_GUIDE.md)
- **Summary**: [PARAM_VALIDATION_SUMMARY.md](./PARAM_VALIDATION_SUMMARY.md)
