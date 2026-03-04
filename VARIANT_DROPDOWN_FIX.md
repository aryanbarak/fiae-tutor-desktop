# Variant Dropdown Fix

## Problem
The variants dropdown was disappearing after selecting a variant. When a user selected a different variant from the dropdown, the entire dropdown would disappear until the app was refreshed.

## Root Cause
The `ResultRenderer` component was using React `useState` for `selectedVariantIndex`, which meant:
1. The component had local state for the selected index
2. There was no stable storage for available variants in the app model
3. When a variant was selected, only the local component state changed
4. No action was dispatched to trigger a re-run with the new variant
5. The variants list was pulled from `response.result.variants` on each render

## Solution
Implemented proper MVU (Model-View-Update) pattern with separated concerns:

### 1. State Structure (model.ts)
Added to `PracticeModel`:
```typescript
export type VariantInfo = {
  id: string;
  title: string;
  labels?: Record<string, string>;
  [key: string]: any;
};

// In PracticeModel:
availableVariants: VariantInfo[];  // Stable list of all variants
selectedVariantId: string | null;  // Currently selected variant
```

### 2. Action (actions.ts)
Added new action:
```typescript
| { type: "PracticeVariantSelected"; variantId: string }
```

### 3. State Updates (update.ts)

#### PracticeRunSucceeded
- Extracts variants from `response.result.variants`
- Maps to `VariantInfo[]` format
- Stores in `model.practice.availableVariants`
- Sets `selectedVariantId` (first variant if none selected)
- Preserves existing variants if response has none (for mode/lang changes)
- Logs: `[VARIANTS] Loaded N variants, selected: X`

#### PracticeTopicChanged
- Clears `availableVariants: []`
- Clears `selectedVariantId: null`
- Variants reload on next run

#### PracticeVariantSelected (NEW)
- Finds selected variant in `availableVariants`
- Updates `selectedVariantId`
- Updates params with `variant: variantId`
- Logs: `[VARIANTS] Selected: A -> B`
- User can manually trigger run to see new variant

### 4. Component Updates (renderers.tsx)

**Before:**
```typescript
interface RendererProps {
  response: CoreResponse;
  lang: "de" | "fa" | "bi";
}

export function ResultRenderer({ response, lang }: RendererProps) {
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const variants = result.variants;
  // ...
  onChange={(e) => setSelectedVariantIndex(Number(e.target.value))}
}
```

**After:**
```typescript
interface ResultRendererProps extends BaseRendererProps {
  availableVariants: VariantInfo[];
  selectedVariantId: string | null;
  onVariantSelect: (variantId: string) => void;
}

export function ResultRenderer({ 
  response, 
  lang, 
  availableVariants, 
  selectedVariantId, 
  onVariantSelect 
}: ResultRendererProps) {
  // No local state - uses props from model
  const selectedVariant = selectedVariantId 
    ? availableVariants.find(v => v.id === selectedVariantId)
    : availableVariants[0];
  // ...
  onChange={(e) => onVariantSelect(e.target.value)}
}
```

### 5. Page Wiring (PracticePage.tsx)
```typescript
<ResultRenderer 
  response={model.response} 
  lang={model.lang}
  availableVariants={model.availableVariants}
  selectedVariantId={model.selectedVariantId}
  onVariantSelect={(variantId) => 
    dispatch({ type: "PracticeVariantSelected", variantId })
  }
/>
```

## Key Benefits
1. **Stable Variants**: `availableVariants` persists across selections
2. **Separation of Concerns**: 
   - `availableVariants` = data source (stable)
   - `selectedVariantId` = current selection (mutable)
   - Component = pure renderer (no local state)
3. **Proper MVU Pattern**: All state in model, actions dispatched for changes
4. **Debug Logging**: Clear visibility into variant loading/selection
5. **Type Safety**: TypeScript ensures proper prop passing

## Testing Checklist
- [ ] Open SelectionSort in pseudocode mode
- [ ] Verify 7 variants appear in dropdown
- [ ] Select "Variant 2" → verify dropdown persists
- [ ] Select "Variant 5" → verify dropdown still shows all 7 variants
- [ ] Switch to BubbleSort → verify variants update to 7 new variants
- [ ] Switch mode to explain → verify variants reload
- [ ] Run multiple times → verify variants remain stable
- [ ] Check console for variant logs: `[VARIANTS] Loaded 7 variants, selected: v1`

## Files Modified
- `src/state/model.ts`: Added VariantInfo type and variant fields to PracticeModel
- `src/state/actions.ts`: Added PracticeVariantSelected action
- `src/state/update.ts`: Updated handlers for variant extraction, selection, and clearing
- `src/components/renderers.tsx`: Refactored ResultRenderer to use props instead of local state
- `src/views/PracticePage.tsx`: Wired up variant props to ResultRenderer
- `src/views/explain/ExplainReader.tsx`: Added placeholder props for ExplainPage
- `src/views/explain/*.tsx`: Fixed unused React imports (cleanup)

## Debug Output Example
```
[VARIANTS] Loaded 7 variants, selected: v1_basic
[VARIANTS] Selected: v1_basic -> v4_optimized
[VARIANTS] Available variants count: 7
[VARIANTS] Switched to variant: Optimized Version
```

## Architecture Notes
This fix demonstrates proper MVU pattern in React:
- **Model**: Single source of truth (availableVariants, selectedVariantId)
- **View**: Pure rendering from props (ResultRenderer)
- **Update**: Pure state transitions (PracticeVariantSelected handler)

The separation ensures:
- State changes are predictable and traceable
- Components are testable and reusable
- No hidden state in component closures
- Easy to debug with console logs in update handlers
