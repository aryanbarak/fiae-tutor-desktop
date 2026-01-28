/**
 * Compact sidebar for Explain Mode controls
 */


import { TopicId, getAllTopicIds, getTopicEntry, getAllowedModes } from "../../domain/topicRegistry";
import { UiMode, toCoreMode, getModeLabel, UI_MODES } from "../../domain/modeMap";

interface ExplainSidebarProps {
  topic: TopicId;
  mode: UiMode;
  lang: "de" | "fa" | "bi";
  paramsText: string;
  paramsOpen: boolean;
  paramsValid: boolean;
  paramsErrors: string[];
  status: "idle" | "running" | "success" | "error";
  onTopicChange: (topic: TopicId) => void;
  onModeChange: (mode: UiMode) => void;
  onLangChange: (lang: "de" | "fa" | "bi") => void;
  onParamsChange: (params: string) => void;
  onParamsToggle: () => void;
  onRun: () => void;
}

const LANGUAGES = ["de", "fa", "bi"] as const;

export function ExplainSidebar({
  topic,
  mode,
  lang,
  paramsText,
  paramsOpen,
  paramsValid,
  paramsErrors,
  status,
  onTopicChange,
  onModeChange,
  onLangChange,
  onParamsChange,
  onParamsToggle,
  onRun,
}: ExplainSidebarProps) {
  const topicEntry = getTopicEntry(topic);
  const allowedCoreModes = getAllowedModes(topic);
  const allowedUiModes = UI_MODES.filter(uiMode => {
    const coreMode = toCoreMode(uiMode);
    return allowedCoreModes.includes(coreMode);
  });
  
  const hasErrors = !paramsValid || paramsErrors.length > 0;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📚 Explain Mode</h2>
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Topic:</label>
        <select
          value={topic}
          onChange={(e) => onTopicChange(e.target.value as TopicId)}
          style={styles.select}
        >
          {getAllTopicIds().map((t) => (
            <option key={t} value={t}>
              {getTopicEntry(t).label}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Mode:</label>
        <select
          value={mode}
          onChange={(e) => onModeChange(e.target.value as UiMode)}
          style={styles.select}
        >
          {allowedUiModes.map((m) => (
            <option key={m} value={m}>
              {getModeLabel(m)}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Language:</label>
        <select
          value={lang}
          onChange={(e) => onLangChange(e.target.value as "de" | "fa" | "bi")}
          style={styles.select}
        >
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {l.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {topicEntry && (
        <div style={styles.description}>{topicEntry.description}</div>
      )}

      {/* Collapsible Params */}
      <div style={styles.section}>
        <button onClick={onParamsToggle} style={styles.paramsToggle}>
          <span>
            Parameters {paramsOpen ? "▾" : "▸"}
            {hasErrors && <span style={styles.errorBadge}> ⚠️</span>}
          </span>
        </button>
        {paramsOpen && (
          <>
            <textarea
              value={paramsText}
              onChange={(e) => onParamsChange(e.target.value)}
              style={{
                ...styles.textarea,
                ...(hasErrors ? styles.textareaError : {}),
              }}
              placeholder='{"arr": [1, 2, 3]}'
            />
            {paramsErrors.length > 0 && (
              <div style={styles.validationErrors}>
                {paramsErrors.map((err, idx) => (
                  <div key={idx} style={styles.validationError}>
                    ❌ {err}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Run Button */}
      <button
        onClick={onRun}
        disabled={status === "running" || hasErrors}
        style={{
          ...styles.runButton,
          ...(status === "running" || hasErrors ? styles.runButtonDisabled : {}),
        }}
      >
        {status === "running" ? "⏳ Loading..." : "▶️ Run"}
      </button>

      {/* Status Badge */}
      <div style={styles.statusSection}>
        <span style={styles.statusLabel}>Status:</span>
        <span
          style={{
            ...styles.statusBadge,
            ...(status === "success"
              ? styles.statusSuccess
              : status === "error"
              ? styles.statusError
              : status === "running"
              ? styles.statusRunning
              : {}),
          }}
        >
          {status.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "300px",
    minWidth: "280px",
    maxWidth: "320px",
    height: "100vh",
    overflowY: "auto" as const,
    background: "#0f0f0f",
    borderRight: "1px solid #333",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "1rem",
  },
  header: {
    marginBottom: "0.5rem",
  },
  title: {
    margin: 0,
    color: "#00ff88",
    fontSize: "18px",
    fontWeight: "bold" as const,
  },
  section: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
  },
  label: {
    fontSize: "13px",
    fontWeight: "bold" as const,
    color: "#ccc",
  },
  select: {
    padding: "8px",
    fontSize: "13px",
    background: "#1a1a1a",
    color: "#fff",
    border: "1px solid #444",
    borderRadius: "6px",
  },
  description: {
    fontSize: "13px",
    color: "#aaffaa",
    background: "#1a2a1a",
    padding: "10px",
    borderRadius: "6px",
    lineHeight: "1.5",
  },
  paramsToggle: {
    width: "100%",
    padding: "8px",
    background: "#2a2a2a",
    color: "#ccc",
    border: "1px solid #444",
    borderRadius: "6px",
    cursor: "pointer" as const,
    textAlign: "left" as const,
    fontSize: "13px",
    fontWeight: "bold" as const,
  },
  textarea: {
    width: "100%",
    minHeight: "100px",
    fontFamily: "monospace",
    fontSize: "12px",
    padding: "8px",
    background: "#1a1a1a",
    color: "#00ff88",
    border: "1px solid #444",
    borderRadius: "6px",
    resize: "vertical" as const,
  },
  textareaError: {
    borderColor: "#ff4444",
    background: "#2a1a1a",
  },
  errorBadge: {
    color: "#ff8844",
    fontSize: "14px",
  },
  validationErrors: {
    marginTop: "0.5rem",
    padding: "8px",
    background: "#2a1a1a",
    border: "1px solid #ff4444",
    borderRadius: "6px",
    fontSize: "12px",
    color: "#ff8844",
  },
  validationError: {
    marginBottom: "4px",
    lineHeight: "1.4",
  },
  runButton: {
    padding: "12px",
    fontSize: "16px",
    background: "#0066cc",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer" as const,
    fontWeight: "bold" as const,
  },
  runButtonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed" as const,
  },
  statusSection: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "13px",
  },
  statusLabel: {
    color: "#aaa",
  },
  statusBadge: {
    padding: "4px 8px",
    borderRadius: "4px",
    fontWeight: "bold" as const,
    fontSize: "11px",
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
};
