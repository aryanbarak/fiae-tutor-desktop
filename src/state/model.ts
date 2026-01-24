import { CoreResponse } from "../domain/types";
import { TopicId, getDefaultParams } from "../domain/topicRegistry";
import { UiMode } from "../domain/modeMap";

export type RunStatus = "idle" | "running" | "success" | "error";

export type ViewTab = "result" | "events" | "questions" | "stats" | "raw" | "logs";

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
    },
  };
}
