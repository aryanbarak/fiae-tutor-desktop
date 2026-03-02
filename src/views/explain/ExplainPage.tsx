/**
 * Explain Mode main page - Reader/textbook layout
 */

import { useEffect, useState } from "react";
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
  const [viewMode, setViewMode] = useState<"algorithms" | "patterns">("algorithms");
  const requestRunIfIdle = () => {
    if (model.status !== "running") {
      dispatch({ type: "PracticeRunRequested" });
    }
  };

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

  useEffect(() => {
    if (viewMode === "patterns" && model.topic !== "master_patterns") {
      dispatch({ type: "PracticeTopicChanged", topic: "master_patterns" });
    }
  }, [viewMode, model.topic, dispatch]);

  // Pass full response to reader for variant support
  const response = model.response || null;
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
      viewMode={viewMode}
      onTopicChange={(topic) => dispatch({ type: "PracticeTopicChanged", topic })}
      onModeChange={(mode) => dispatch({ type: "PracticeModeChanged", mode })}
      onLangChange={(lang) => dispatch({ type: "PracticeLangChanged", lang })}
      onParamsChange={(paramsText) => dispatch({ type: "PracticeParamsChanged", paramsText })}
      onParamsToggle={() => dispatch({ type: "PracticeParamsEditorToggle" })}
      onViewModeChange={(nextViewMode) => setViewMode(nextViewMode)}
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
      topic={model.topic}
      viewMode={viewMode}
      response={response}
      error={error}
      status={model.status}
      lang={model.lang}
      availableVariants={model.availableVariants}
      selectedVariantId={model.selectedVariantId}
      onVariantSelect={(variantId) => dispatch({ type: "PracticeVariantSelected", variantId })}
      onVariantRunRequested={(variantId) => {
        if (model.topic !== "master_patterns") {
          setViewMode("patterns");
          dispatch({ type: "PracticeTopicChanged", topic: "master_patterns" });
          return;
        }
        if (model.selectedVariantId === variantId) {
          return;
        }
        dispatch({ type: "PracticeVariantSelected", variantId });
        requestRunIfIdle();
      }}
      onRelatedTopicSelect={(topic) => {
        setViewMode("algorithms");
        if (model.topic !== topic) {
          dispatch({ type: "PracticeTopicChanged", topic });
        }
        requestRunIfIdle();
      }}
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
