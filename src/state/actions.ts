import { CoreResponse } from "../domain/types";
import { AppModel } from "./model";
import { TopicId } from "../domain/topicRegistry";
import { UiMode } from "../domain/modeMap";

/**
 * Messages represent events/actions in the app (MVU pattern)
 */
export type Msg =
  | { type: "PracticeTopicChanged"; topic: TopicId }
  | { type: "PracticeModeChanged"; mode: UiMode }
  | { type: "PracticeLangChanged"; lang: "de" | "fa" | "bi" }
  | { type: "PracticeParamsChanged"; paramsText: string }
  | { type: "PracticeTabChanged"; tab: AppModel["practice"]["viewTab"] }
  | { type: "PracticeRunRequested" }
  | { type: "PracticeRunSucceeded"; response: CoreResponse; raw: string; logs: string[] }
  | { type: "PracticeRunFailed"; error: string; raw?: string; logs?: string[] }
  | { type: "PracticeVariantSelected"; variantId: string } // Select a variant from available variants
  | { type: "PracticeEventFirst" }
  | { type: "PracticeEventPrev" }
  | { type: "PracticeEventNext" }
  | { type: "PracticeEventLast" }
  | { type: "PracticeEventSet"; index: number }
  | { type: "PracticeEventFilterChanged"; filter: string | null }
  | { type: "PracticeLoadPreset"; topic: TopicId; mode: UiMode }
  | { type: "PracticeAddLog"; log: string }
  | { type: "PracticeRequestPreviewToggle" }
  | { type: "PracticeCopyRequest" }
  | { type: "PracticeCopyResult" }
  | { type: "PracticeSelfTest" }
  | { type: "PracticeParamsEditorToggle" }
  | { type: "PracticeFullscreenToggle" }
  | { type: "PingSelfTest" }
  | { type: "PingSucceeded"; result: string }
  | { type: "PingFailed"; error: string };
