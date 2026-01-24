/**
 * Explain Mode main page - Reader/textbook layout
 */

import React, { useEffect } from "react";
import { PracticeModel } from "../../state/model";
import { Msg } from "../../state/actions";
import { ExplainLayout } from "./ExplainLayout";
import { ExplainSidebar } from "./ExplainSidebar";
import { ExplainMetaBar } from "./ExplainMetaBar";
import { ExplainReader } from "./ExplainReader";

interface ExplainPageProps {
  model: PracticeModel;
  dispatch: (msg: Msg) => void;
}

export function ExplainPage({ model, dispatch }: ExplainPageProps) {
  // ESC key handler for fullscreen
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && model.isFullscreen) {
        dispatch({ type: "PracticeFullscreenToggle" });
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [model.isFullscreen, dispatch]);

  // Extract explain text from response
  const explainText = model.response?.result?.explain || null;
  const error = model.status === "error" ? model.error || "Unknown error" : null;

  const sidebar = (
    <ExplainSidebar
      topic={model.topic}
      mode={model.mode}
      lang={model.lang}
      paramsText={model.paramsText}
      paramsOpen={model.paramsEditorOpen}
      paramsValid={model.paramsValid}
      paramsErrors={model.paramsErrors}
      status={model.status}
      onTopicChange={(topic) => dispatch({ type: "PracticeTopicChanged", topic })}
      onModeChange={(mode) => dispatch({ type: "PracticeModeChanged", mode })}
      onLangChange={(lang) => dispatch({ type: "PracticeLangChanged", lang })}
      onParamsChange={(paramsText) => dispatch({ type: "PracticeParamsChanged", paramsText })}
      onParamsToggle={() => dispatch({ type: "PracticeParamsEditorToggle" })}
      onRun={() => {
        if (model.status !== "running") {
          dispatch({ type: "PracticeRunRequested" });
        }
      }}
    />
  );

  const metaBar = (
    <ExplainMetaBar
      topic={model.topic}
      lang={model.lang}
      isFullscreen={model.isFullscreen}
      onFullscreenToggle={() => dispatch({ type: "PracticeFullscreenToggle" })}
    />
  );

  const reader = (
    <ExplainReader
      explainText={explainText}
      error={error}
      status={model.status}
      lang={model.lang}
      onRetry={() => dispatch({ type: "PracticeRunRequested" })}
    />
  );

  return (
    <ExplainLayout
      sidebar={sidebar}
      metaBar={metaBar}
      reader={reader}
      isFullscreen={model.isFullscreen}
    />
  );
}
