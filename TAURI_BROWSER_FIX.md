# Tauri Browser Safety Fix

## Problem
Running `npm run dev` (Vite only) and clicking "Run" caused a crash:
```
Cannot read properties of undefined (reading 'invoke')
```

The app tried to call Tauri's `invoke()` in a normal browser where it doesn't exist.

## Solution
Added a safe wrapper layer that:
1. **Detects Tauri environment** - checks for `window.__TAURI__`
2. **Throws clear error** - if not in Tauri, shows actionable message
3. **Shows friendly UI** - custom error panel explaining how to run properly

## Files Changed

### ✅ New: `src/lib/tauriInvoke.ts`
Safe wrapper utilities:
- `isTauri()` - Safely detect Tauri environment
- `safeInvoke()` - Wrapper that throws `TauriNotAvailableError` in browser
- `TauriNotAvailableError` - Custom error with code `E_NOT_TAURI`

### ✅ Modified: `src/api/coreClient.ts`
Replaced direct `invoke` imports with `safeInvoke`:
```diff
- import { invoke } from "@tauri-apps/api/core";
+ import { safeInvoke } from "../lib/tauriInvoke";

- await invoke<string>("run_tutor", {...})
+ await safeInvoke<string>("run_tutor", {...})
```

### ✅ Modified: `src/views/PracticePage.tsx`
Enhanced error display to detect `E_NOT_TAURI` and show:
- Clear browser icon 🌐
- Explanation of the issue
- Command to run: `npm run tauri dev`
- Helpful tip about using the desktop window

## Behavior

### In Browser (localhost:1420)
❌ Before: Crash with cryptic error  
✅ After: Clear message:
```
🌐 You're running in a browser

This app requires the Tauri desktop environment 
to communicate with the Python backend.

  npm run tauri dev

💡 Tip: Close this browser tab and use the desktop window that opens.
```

### In Tauri Desktop (`npm run tauri dev`)
✅ Works exactly as before - no changes to behavior

## Testing
```bash
# Test 1: Browser should show friendly error
npm run dev
# Open localhost:1420, click Run → see friendly message

# Test 2: Tauri should work normally  
npm run tauri dev
# Desktop window opens, click Run → executes normally
```

## Type Safety
All TypeScript types maintained:
- `safeInvoke<T>` preserves generic return type
- Custom error class extends `Error` properly
- No `any` types introduced
