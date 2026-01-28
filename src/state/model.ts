import { CoreResponse } from "../domain/types";
import { TopicId, getDefaultParams } from "../domain/topicRegistry";
import { UiMode } from "../domain/modeMap";

export type RunStatus = "idle" | "running" | "success" | "error";

export type ViewTab = "result" | "events" | "questions" | "stats" | "raw" | "logs";

export type VariantInfo = {
  id: string;
  title: string;
  labels?: Record<string, string>;
  [key: string]: any; // Allow other variant-specific data
};

export type PracticeModel = {
  topic: TopicId;
  mode: UiMode; // UI can use trace_learn, gets mapped to trace when sent to core
  lang: "de" | "fa" | "bi";
  paramsText: string; // JSON string representation of params (editable)
  paramsValid: boolean; // whether paramsText is valid JSON
  paramsErrors: string[]; // validation errors from topicRegistry
  status: RunStatus;
  error?: string;
  response?: CoreResponse;
  raw?: string; // raw JSON string for Raw tab
  viewTab: ViewTab;
  eventIndex: number; // current event pointer for stepper
  eventFilter: string | null; // filter events by type
  logs: string[]; // debug log ring buffer
  requestPreviewOpen: boolean; // accordion state for request preview
  paramsEditorOpen: boolean; // whether params editor is expanded (for collapsible UI)
  isFullscreen: boolean; // fullscreen mode hides controls panel
  // Variant management (separate from response to persist across selections)
  availableVariants: VariantInfo[]; // All variants for current topic/mode
  selectedVariantId: string | null; // Currently selected variant ID
};

export type AppModel = {
  practice: PracticeModel;
};

/**
 * Initial application state
 */
export function initialModel(): AppModel {
  const topic: TopicId = "bubblesort";
  const mode: UiMode = "pseudocode";
  const lang = "de";
  const params = getDefaultParams(topic);

  // Load UI preferences from localStorage
  const paramsEditorOpen = localStorage.getItem("fiae-paramsEditorOpen") !== "false"; // default to open for first-time users
  const isFullscreen = false; // always start in normal mode

  return {
    practice: {
      topic,
      mode,
      lang,
      paramsText: JSON.stringify(params, null, 2),
      paramsValid: true,
      paramsErrors: [],
      status: "idle",
      viewTab: "result",
      eventIndex: 0,
      eventFilter: null,
      logs: ["[INIT] App initialized"],
      requestPreviewOpen: false,
      paramsEditorOpen,
      isFullscreen,
      availableVariants: [],
      selectedVariantId: null,
    },
  };
}
