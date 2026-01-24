/**
 * Practice Page - Production-grade MVU UI with 2-column responsive layout
 */

import { useEffect } from "react";
import { PracticeModel } from "../state/model";
import { Msg } from "../state/actions";
import { getAllTopicIds, getTopicEntry, getAllowedModes } from "../domain/topicRegistry";
import { toCoreMode, getModeLabel, UI_MODES } from "../domain/modeMap";
import { ErrorBoundary } from "../components/ErrorBoundary";
import {
  ResultRenderer,
  EventsRenderer,
  QuestionsRenderer,
  StatsRenderer,
  RawJsonRenderer,
  LogsRenderer,
} from "../components/renderers";

const LANGUAGES = ["de", "fa", "bi"] as const;

interface PracticePageProps {
  model: PracticeModel;
  dispatch: (msg: Msg) => void;
}

export function PracticePage({ model, dispatch }: PracticePageProps) {
  const topicEntry = getTopicEntry(model.topic);
  const hasErrors = !model.paramsValid || model.paramsErrors.length > 0;

  // ESC key handler for fullscreen mode
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && model.isFullscreen) {
        dispatch({ type: "PracticeFullscreenToggle" });
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [model.isFullscreen, dispatch]);

  // Get allowed core modes for current topic, then map to UI modes
  const allowedCoreModes = getAllowedModes(model.topic);
  const allowedUiModes = UI_MODES.filter(uiMode => {
    const coreMode = toCoreMode(uiMode);
    return allowedCoreModes.includes(coreMode);
  });

  // Build request object for preview (using core mode)
  let requestObj: any = null;
  try {
    const params = JSON.parse(model.paramsText);
    requestObj = {
      version: "1.0",
      topic: model.topic,
      mode: toCoreMode(model.mode), // ✅ Preview shows core mode
      lang: model.lang,
      params,
    };
  } catch {
    // Invalid JSON - can't build request
  }

  return (
    <div style={styles.pageContainer}>
      {/* Controls Panel (left side, hidden when fullscreen) */}
      {!model.isFullscreen && (
        <div style={styles.controlsPanel}>
          <h1 style={styles.title}>🎓 FIAE Tutor</h1>

          {/* Controls */}
          <div style={styles.controlsSection}>
            <div style={styles.controlGroup}>
              <label style={styles.label}>Topic:</label>
              <select
                value={model.topic}
                onChange={(e: any) =>
                  dispatch({ type: "PracticeTopicChanged", topic: e.target.value })
                }
                style={styles.select}
                title="Select algorithm topic"
              >
                {getAllTopicIds().map((topic) => (
                  <option key={topic} value={topic}>
                    {getTopicEntry(topic).label}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.controlGroup}>
              <label style={styles.label}>Mode:</label>
              <select
                value={model.mode}
                onChange={(e: any) =>
                  dispatch({ type: "PracticeModeChanged", mode: e.target.value })
                }
                style={styles.select}
                title="Select execution mode"
              >
                {allowedUiModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {getModeLabel(mode)}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.controlGroup}>
              <label style={styles.label}>Language:</label>
              <select
                value={model.lang}
                onChange={(e) =>
                  dispatch({
                    type: "PracticeLangChanged",
                    lang: e.target.value as "de" | "fa" | "bi",
                  })
                }
                style={styles.select}
                title="Select output language"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Topic Description */}
          {topicEntry && (
            <div style={styles.topicInfo}>
              <strong>{topicEntry.label}:</strong> {topicEntry.description}
            </div>
          )}

          {/* Params Editor (Collapsible) */}
          <div style={styles.paramsSection}>
            <button
              onClick={() => dispatch({ type: "PracticeParamsEditorToggle" })}
              style={styles.paramsSectionHeader}
              title={model.paramsEditorOpen ? "Collapse params editor" : "Expand params editor"}
            >
              <span style={styles.paramsSectionTitle}>
                Parameters (JSON)
                {!model.paramsValid && (
                  <span style={styles.errorLabel}> ⚠️ Error</span>
                )}
              </span>
              <span style={styles.toggleIcon}>
                {model.paramsEditorOpen ? "▾" : "▸"}
              </span>
            </button>

            {model.paramsEditorOpen && (
              <>
                <textarea
                  value={model.paramsText}
                  onChange={(e) =>
                    dispatch({
                      type: "PracticeParamsChanged",
                      paramsText: e.target.value,
                    })
                  }
                  style={{
                    ...styles.textarea,
                    ...(hasErrors ? styles.textareaError : {}),
                  }}
                  title="Edit request parameters as JSON"
                  placeholder='{"arr": [1, 2, 3]}'
                />
                {model.paramsErrors.length > 0 && (
                  <div style={styles.validationErrors}>
                    {model.paramsErrors.map((err, idx) => (
                      <div key={idx} style={styles.validationError}>
                        ❌ {err}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Request Preview Accordion */}
          <div style={styles.accordion}>
            <button
              onClick={() => dispatch({ type: "PracticeRequestPreviewToggle" })}
              style={styles.accordionButton}
            >
              {model.requestPreviewOpen ? "▼" : "▶"} Request Preview
            </button>
            {model.requestPreviewOpen && requestObj && (
              <pre style={styles.requestPreview}>
                {JSON.stringify(requestObj, null, 2)}
              </pre>
            )}
          </div>

          {/* Action Buttons */}
          <div style={styles.buttonSection}>
            <button
              onClick={() => {
                if (model.status === "running") {
                  console.warn("[VIEW] Run blocked - already running");
                  return;
                }
                dispatch({ type: "PracticeRunRequested" });
              }}
              disabled={model.status === "running" || hasErrors}
              style={{
                ...styles.runButton,
                ...(model.status === "running" || hasErrors
                  ? styles.buttonDisabled
                  : {}),
              }}
            >
              {model.status === "running" ? "⏳ Running..." : "▶️ Run"}
            </button>

            <button
              onClick={() => dispatch({ type: "PracticeCopyRequest" })}
              style={styles.secondaryButton}
              disabled={hasErrors}
              title="Copy request JSON to clipboard"
            >
              📋 Request
            </button>

            {model.raw && (
              <button
                onClick={() => dispatch({ type: "PracticeCopyResult" })}
                style={styles.secondaryButton}
                title="Copy result JSON to clipboard"
              >
                📋 Result
              </button>
            )}

            <button
              onClick={() => dispatch({ type: "PracticeSelfTest" })}
              style={styles.secondaryButton}
              title="Run self-test"
            >
              🧪 Test
            </button>
          </div>

          {/* Status Badge */}
          <div style={styles.statusSection}>
            <span style={styles.statusLabel}>Status:</span>
            <span
              style={{
                ...styles.statusBadge,
                ...(model.status === "success"
                  ? styles.statusSuccess
                  : model.status === "error"
                  ? styles.statusError
                  : model.status === "running"
                  ? styles.statusRunning
                  : {}),
              }}
            >
              {model.status}
            </span>
          </div>
        </div>
      )}

      {/* Output Panel (right side, always visible) */}
      <div style={{
        ...styles.outputPanel,
        ...(model.isFullscreen ? styles.outputPanelFullscreen : {}),
      }}>
        {/* Fullscreen mode header */}
        {model.isFullscreen && (
          <div style={styles.fullscreenHeader}>
            <h2 style={styles.fullscreenTitle}>🎓 FIAE Tutor</h2>
            <div style={styles.fullscreenControls}>
              <button
                onClick={() => dispatch({ type: "PracticeRunRequested" })}
                disabled={model.status === "running" || hasErrors}
                style={{
                  ...styles.runButton,
                  ...(model.status === "running" || hasErrors
                    ? styles.buttonDisabled
                    : {}),
                }}
              >
                {model.status === "running" ? "⏳ Running..." : "▶️ Run"}
              </button>
              <button
                onClick={() => dispatch({ type: "PracticeFullscreenToggle" })}
                style={styles.secondaryButton}
                title="Exit fullscreen (ESC)"
              >
                ⛶ Exit Fullscreen
              </button>
            </div>
          </div>
        )}

        {/* Fullscreen toggle button (normal mode) */}
        {!model.isFullscreen && (
          <div style={styles.outputHeader}>
            <button
              onClick={() => dispatch({ type: "PracticeFullscreenToggle" })}
              style={styles.fullscreenToggleButton}
              title="Toggle fullscreen output"
            >
              ⛶ Fullscreen
            </button>
          </div>
        )}

        {/* Error Display */}
        {model.status === "error" && model.error && (
          <div style={styles.errorPanel}>
            <div style={styles.errorHeader}>⚠️ ERROR</div>
            <pre style={styles.errorText}>{model.error}</pre>
          </div>
        )}

        {/* Tabs */}
        <div style={styles.tabsContainer}>
          {(["result", "events", "questions", "stats", "raw", "logs"] as const).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => {
                  if (model.status === "running") {
                    console.warn("[VIEW] Tab switch blocked - process still running");
                    return;
                }
                dispatch({ type: "PracticeTabChanged", tab });
              }}
              disabled={model.status === "running"}
              style={{
                ...styles.tab,
                ...(model.viewTab === tab ? styles.tabActive : {}),
                ...(model.status === "running" ? styles.tabDisabled : {}),
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          )
        )}
      </div>

      {/* Tab Content */}
      <div style={styles.tabContent}>
        <ErrorBoundary>
          {renderTabContent(model, dispatch)}
        </ErrorBoundary>
      </div>
    </div>
    </div>
  );
}

function renderTabContent(model: PracticeModel, dispatch: (msg: Msg) => void) {
  if (model.status === "running") {
    return (
      <div style={styles.loadingPanel}>
        <div style={styles.spinner}>⏳</div>
        <div>Running core...</div>
      </div>
    );
  }

  if (!model.response && model.viewTab !== "logs") {
    return (
      <div style={styles.emptyPanel}>
        No output yet. Click Run to execute.
      </div>
    );
  }

  switch (model.viewTab) {
    case "result":
      return model.response ? (
        <ErrorBoundary
          fallback={
            <div>
              <div style={styles.errorHeader}>Rendering error</div>
              <pre style={styles.jsonFallback}>
                {JSON.stringify(model.response.result, null, 2)}
              </pre>
            </div>
          }
        >
          <ResultRenderer response={model.response} lang={model.lang} />
        </ErrorBoundary>
      ) : (
        <div style={styles.emptyPanel}>No result</div>
      );

    case "events":
      return model.response ? (
        <ErrorBoundary
          fallback={
            <div>
              <div style={styles.errorHeader}>Rendering error</div>
              <pre style={styles.jsonFallback}>
                {JSON.stringify(model.response.events, null, 2)}
              </pre>
            </div>
          }
        >
          <EventsRenderer
            response={model.response}
            lang={model.lang}
            eventIndex={model.eventIndex}
            onEventChange={(index) =>
              dispatch({ type: "PracticeEventSet", index })
            }
          />
        </ErrorBoundary>
      ) : (
        <div style={styles.emptyPanel}>No events</div>
      );

    case "questions":
      return model.response ? (
        <ErrorBoundary
          fallback={
            <div>
              <div style={styles.errorHeader}>Rendering error</div>
              <pre style={styles.jsonFallback}>
                {JSON.stringify((model.response.result as any)?.questions, null, 2)}
              </pre>
            </div>
          }
        >
          <QuestionsRenderer response={model.response} lang={model.lang} />
        </ErrorBoundary>
      ) : (
        <div style={styles.emptyPanel}>No questions</div>
      );

    case "stats":
      return model.response ? (
        <ErrorBoundary
          fallback={
            <div>
              <div style={styles.errorHeader}>Rendering error</div>
              <pre style={styles.jsonFallback}>
                {JSON.stringify(model.response.stats, null, 2)}
              </pre>
            </div>
          }
        >
          <StatsRenderer response={model.response} lang={model.lang} />
        </ErrorBoundary>
      ) : (
        <div style={styles.emptyPanel}>No stats</div>
      );

    case "raw":
      return <RawJsonRenderer rawJson={model.raw || null} />;

    case "logs":
      return <LogsRenderer logs={model.logs} />;

    default:
      return <div style={styles.emptyPanel}>Unknown tab</div>;
  }
}

// Styles
const styles = {
  pageContainer: {
    display: "flex",
    flexDirection: "row" as const,
    height: "100vh",
    overflow: "hidden",
  },
  controlsPanel: {
    width: "350px",
    minWidth: "320px",
    maxWidth: "380px",
    height: "100vh",
    overflowY: "auto" as const,
    background: "#0a0a0a",
    borderRight: "1px solid #333",
    padding: "1rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "1rem",
  },
  outputPanel: {
    flex: 1,
    height: "100vh",
    overflowY: "auto" as const,
    background: "#000",
    display: "flex",
    flexDirection: "column" as const,
  },
  outputPanelFullscreen: {
    width: "100vw",
  },
  outputHeader: {
    padding: "0.5rem 1rem",
    borderBottom: "1px solid #333",
    display: "flex",
    justifyContent: "flex-end",
  },
  fullscreenHeader: {
    padding: "1rem",
    borderBottom: "1px solid #333",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#0a0a0a",
  },
  fullscreenTitle: {
    margin: 0,
    color: "#00ff88",
    fontSize: "20px",
  },
  fullscreenControls: {
    display: "flex",
    gap: "0.5rem",
  },
  fullscreenToggleButton: {
    padding: "6px 12px",
    fontSize: "13px",
    background: "#333",
    color: "#aaa",
    border: "1px solid #555",
    borderRadius: "4px",
    cursor: "pointer" as const,
  },
  title: {
    margin: "0 0 1rem 0",
    color: "#00ff88",
    fontSize: "18px",
    fontWeight: "bold" as const,
  },
  controlsSection: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.75rem",
  },
  controlGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.25rem",
  },
  label: {
    fontSize: "13px",
    fontWeight: "bold" as const,
    color: "#ccc",
  },
  select: {
    padding: "6px 10px",
    fontSize: "13px",
    background: "#222",
    color: "#fff",
    border: "1px solid #444",
    borderRadius: "4px",
  },
  topicInfo: {
    background: "#1a2a1a",
    padding: "10px",
    borderRadius: "6px",
    color: "#aaffaa",
    fontSize: "13px",
    lineHeight: "1.5",
  },
  paramsSection: {
    display: "flex",
    flexDirection: "column" as const,
  },
  paramsSectionHeader: {
    width: "100%",
    padding: "10px",
    background: "#2a2a2a",
    color: "#ccc",
    border: "1px solid #444",
    borderRadius: "4px",
    cursor: "pointer" as const,
    textAlign: "left" as const,
    fontSize: "13px",
    fontWeight: "bold" as const,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paramsSectionTitle: {
    flex: 1,
  },
  toggleIcon: {
    fontSize: "16px",
    color: "#888",
  },
  textarea: {
    width: "100%",
    minHeight: "120px",
    maxHeight: "300px",
    fontFamily: "monospace",
    fontSize: "12px",
    padding: "8px",
    background: "#222",
    color: "#00ff88",
    border: "1px solid #444",
    borderRadius: "4px",
    resize: "vertical" as const,
    marginTop: "8px",
  },
  textareaError: {
    borderColor: "#ff6666",
    background: "#331111",
  },
  errorLabel: {
    color: "#ff6666",
    fontSize: "11px",
    marginLeft: "8px",
  },
  validationErrors: {
    marginTop: "8px",
    padding: "8px",
    background: "#331111",
    border: "1px solid #ff6666",
    borderRadius: "4px",
  },
  validationError: {
    color: "#ff9999",
    fontSize: "12px",
    marginBottom: "4px",
  },
  accordion: {
    display: "flex",
    flexDirection: "column" as const,
  },
  accordionButton: {
    width: "100%",
    padding: "8px",
    background: "#2a2a2a",
    color: "#aaa",
    border: "1px solid #444",
    borderRadius: "4px",
    cursor: "pointer" as const,
    textAlign: "left" as const,
    fontSize: "12px",
  },
  requestPreview: {
    background: "#1a1a1a",
    color: "#66ccff",
    padding: "10px",
    borderRadius: "4px",
    fontSize: "11px",
    overflowX: "auto" as const,
    marginTop: "6px",
  },
  buttonSection: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "0.5rem",
  },
  runButton: {
    padding: "10px 20px",
    fontSize: "14px",
    background: "#0066cc",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer" as const,
    fontWeight: "bold" as const,
  },
  secondaryButton: {
    padding: "8px 14px",
    fontSize: "13px",
    background: "#444",
    color: "#fff",
    border: "1px solid #666",
    borderRadius: "4px",
    cursor: "pointer" as const,
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed" as const,
  },
  statusSection: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  statusLabel: {
    fontSize: "13px",
    color: "#aaa",
  },
  statusBadge: {
    padding: "4px 8px",
    borderRadius: "4px",
    fontWeight: "bold" as const,
    fontSize: "11px",
    textTransform: "uppercase" as const,
  },
  statusSuccess: {
    background: "#1a3a1a",
    color: "#00ff88",
  },
  statusError: {
    background: "#3a1a1a",
    color: "#ff6666",
  },
  statusRunning: {
    background: "#1a1a3a",
    color: "#6699ff",
  },
  errorPanel: {
    background: "#300",
    border: "2px solid #ff6666",
    borderRadius: "8px",
    padding: "16px",
    margin: "1rem",
  },
  errorHeader: {
    color: "#ff6666",
    fontWeight: "bold" as const,
    marginBottom: "8px",
    fontSize: "16px",
  },
  errorText: {
    color: "#ff9999",
    fontSize: "13px",
    whiteSpace: "pre-wrap" as const,
    fontFamily: "monospace",
  },
  tabsContainer: {
    borderBottom: "2px solid #444",
    display: "flex",
    gap: "4px",
    flexWrap: "wrap" as const,
    padding: "0 1rem",
    background: "#0a0a0a",
  },
  tab: {
    padding: "10px 18px",
    background: "#1a1a1a",
    color: "#888",
    border: "none",
    borderBottom: "3px solid transparent",
    cursor: "pointer" as const,
    fontSize: "13px",
    fontWeight: "bold" as const,
  },
  tabActive: {
    color: "#00ff88",
    borderBottomColor: "#00ff88",
    background: "#0d1b0d",
  },
  tabDisabled: {
    opacity: 0.5,
    cursor: "not-allowed" as const,
  },
  tabContent: {
    flex: 1,
    padding: "1rem",
    background: "#000",
    overflowY: "auto" as const,
  },
  loadingPanel: {
    textAlign: "center" as const,
    padding: "4rem",
    color: "#6699ff",
  },
  spinner: {
    fontSize: "48px",
    marginBottom: "1rem",
  },
  emptyPanel: {
    textAlign: "center" as const,
    padding: "4rem",
    color: "#666",
    fontStyle: "italic" as const,
  },
  jsonFallback: {
    background: "#1a1a1a",
    color: "#cccccc",
    padding: "16px",
    borderRadius: "8px",
    fontSize: "13px",
    overflowX: "auto" as const,
  },
};
