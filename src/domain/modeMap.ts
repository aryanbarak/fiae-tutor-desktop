/**
 * Mode Mapper - UI modes to Core modes
 * Handles legacy UI values like "trace_learn" which don't exist in core
 */

import type { CoreMode } from "./topicRegistry";

// UI modes (for backwards compatibility with existing UI)
export type UiMode = "explain" | "pseudocode" | "trace_learn" | "trace" | "trace_exam" | "quiz" | "debug" | "exam_session";

/**
 * Map UI mode to Core mode
 * Handles legacy "trace_learn" → "trace" conversion
 */
export function toCoreMode(uiMode: UiMode | CoreMode): CoreMode {
  switch (uiMode) {
    case "trace_learn":
      return "trace"; // Legacy UI mode maps to core "trace"
    case "explain":
    case "pseudocode":
    case "trace":
    case "trace_exam":
    case "quiz":
    case "debug":
    case "exam_session":
      return uiMode as CoreMode;
    default:
      // Fallback to pseudocode for unknown modes
      console.warn(`Unknown mode '${uiMode}', falling back to 'pseudocode'`);
      return "pseudocode";
  }
}

/**
 * Get UI-friendly mode label
 */
export function getModeLabel(mode: UiMode | CoreMode): string {
  const labels: Record<string, string> = {
    explain: "Explain",
    pseudocode: "Pseudocode",
    trace_learn: "Trace (Learn)",
    trace: "Trace",
    trace_exam: "Trace (Exam)",
    quiz: "Quiz",
    debug: "Debug",
    exam_session: "Exam Session",
  };
  return labels[mode] || mode;
}

/**
 * Get all UI mode options (for dropdown)
 * Note: UI can show "trace_learn" but it gets mapped to "trace" when sent to core
 */
export const UI_MODES: UiMode[] = [
  "explain",
  "pseudocode",
  "trace_learn",
  "trace_exam",
  "quiz",
  "debug",
  "exam_session",
];
