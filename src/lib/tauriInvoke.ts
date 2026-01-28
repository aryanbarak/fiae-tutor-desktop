/**
 * Safe Tauri invoke wrapper
 * Prevents crashes when running in a normal browser (Vite dev server)
 */

// Custom error type for non-Tauri environments
export class TauriNotAvailableError extends Error {
  code = "E_NOT_TAURI";
  
  constructor() {
    super(
      "This action requires Tauri. Please run the app via: npm run tauri dev"
    );
    this.name = "TauriNotAvailableError";
  }
}

/**
 * Check if running inside Tauri environment
 * Safe to call from any context
 */
export function isTauri(): boolean {
  try {
    // Check for Tauri's global objects (v1 and v2 compatible)
    if (typeof window === "undefined") {
      console.log("[isTauri] window is undefined");
      return false;
    }
    
    // Check multiple possible Tauri global indicators
    const checks = {
      __TAURI__: "__TAURI__" in window,
      __TAURI_INTERNALS__: "__TAURI_INTERNALS__" in window,
      __TAURI_INVOKE__: "__TAURI_INVOKE__" in window,
      anyTauri: (window as any).__TAURI__ !== undefined,
      anyInternals: (window as any).__TAURI_INTERNALS__ !== undefined,
    };

    console.log("[isTauri] Detection checks:", checks);
    console.log("[isTauri] Window keys with TAURI:", Object.keys(window).filter(k => k.includes("TAURI")));

    const result = Object.values(checks).some(v => v);
    console.log("[isTauri] Final result:", result);
    
    return result;
  } catch (error) {
    console.error("[isTauri] Error during detection:", error);
    return false;
  }
}

/**
 * Safe invoke wrapper that throws a clear error if not in Tauri
 * @param cmd - Tauri command name
 * @param args - Optional arguments for the command
 * @returns Promise with the command result
 * @throws TauriNotAvailableError if not running in Tauri
 * @throws Error if command fails
 */
export async function safeInvoke<T>(
  cmd: string,
  args?: Record<string, unknown>
): Promise<T> {
  // First check environment
  if (!isTauri()) {
    console.error("[safeInvoke] Not in Tauri environment");
    throw new TauriNotAvailableError();
  }

  try {
    // Try dynamic import
    const tauriCore = await import("@tauri-apps/api/core");
    console.log("[safeInvoke] Tauri core imported successfully");
    
    if (!tauriCore.invoke) {
      console.error("[safeInvoke] invoke function not found in Tauri core");
      throw new TauriNotAvailableError();
    }
    
    return await tauriCore.invoke<T>(cmd, args);
  } catch (error) {
    // If it's already our error, re-throw
    if (error instanceof TauriNotAvailableError) {
      throw error;
    }
    
    console.error("[safeInvoke] Error importing or calling Tauri:", error);
    // Re-throw the original error (could be from invoke itself)
    throw error;
  }
}
