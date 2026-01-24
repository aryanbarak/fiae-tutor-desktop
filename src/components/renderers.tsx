/**
 * Output renderers for different response types
 */

import React from "react";
import { CoreResponse } from "../domain/types";

interface RendererProps {
  response: CoreResponse;
  lang: "de" | "fa" | "bi";
}

/**
 * Render Result tab - shows pseudocode, explain text, or structured data
 */
export function ResultRenderer({ response }: RendererProps) {
  const result = response?.result as any;

  if (!result) {
    return <div style={styles.empty}>No result data</div>;
  }

  // Pseudocode mode
  if (result.pseudocode && typeof result.pseudocode === "string") {
    return (
      <div>
        <div style={styles.header}>
          📝 {result.algorithm || "Algorithm"} - {result.variant || ""}
        </div>
        <pre style={styles.codeBlock}>{result.pseudocode}</pre>
        <button
          onClick={() => navigator.clipboard.writeText(result.pseudocode)}
          style={styles.copyButton}
        >
          📋 Copy Code
        </button>
      </div>
    );
  }

  // Explain mode - check FIRST before fallback
  if (result.explain && typeof result.explain === "string") {
    return (
      <div>
        <div style={styles.header}>💡 Explanation</div>
        <div style={styles.explainText}>
          {result.explain}
        </div>
        {/* Show other fields if present */}
        {Object.keys(result).length > 1 && (
          <details style={{ marginTop: "1rem" }}>
            <summary style={{ cursor: "pointer", color: "#88ccff" }}>Other Result Fields</summary>
            <div style={styles.keyValueContainer}>
              {Object.entries(result).filter(([k]) => k !== "explain").map(([key, value]) => (
                <div key={key} style={styles.keyValueRow}>
                  <span style={styles.key}>{key}:</span>
                  <span style={styles.value}>
                    {typeof value === "object"
                      ? JSON.stringify(value, null, 2)
                      : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    );
  }

  // Fallback: show structured data
  return (
    <div>
      <div style={styles.header}>📊 Result Data</div>
      <div style={styles.keyValueContainer}>
        {Object.entries(result).map(([key, value]) => (
          <div key={key} style={styles.keyValueRow}>
            <span style={styles.key}>{key}:</span>
            <span style={styles.value}>
              {typeof value === "object"
                ? JSON.stringify(value, null, 2)
                : String(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Render Events tab - shows trace events in a table
 */
export function EventsRenderer({
  response,
  lang,
  eventIndex,
  onEventChange,
}: RendererProps & {
  eventIndex: number;
  onEventChange: (index: number) => void;
}) {
  const events = response?.events || [];

  if (events.length === 0) {
    return <div style={styles.empty}>No events in this execution</div>;
  }

  const currentEvent = events[eventIndex] || events[0];

  return (
    <div>
      {/* Navigation */}
      <div style={styles.eventNav}>
        <button
          onClick={() => onEventChange(0)}
          disabled={eventIndex === 0}
          style={styles.navButton}
        >
          First
        </button>
        <button
          onClick={() => onEventChange(Math.max(0, eventIndex - 1))}
          disabled={eventIndex === 0}
          style={styles.navButton}
        >
          ← Prev
        </button>
        <span style={styles.eventCounter}>
          Event {eventIndex + 1} / {events.length}
        </span>
        <button
          onClick={() => onEventChange(Math.min(events.length - 1, eventIndex + 1))}
          disabled={eventIndex >= events.length - 1}
          style={styles.navButton}
        >
          Next →
        </button>
        <button
          onClick={() => onEventChange(events.length - 1)}
          disabled={eventIndex >= events.length - 1}
          style={styles.navButton}
        >
          Last
        </button>
      </div>

      {/* Current event */}
      <div style={styles.eventCard}>
        <div style={styles.eventHeader}>
          Event #{currentEvent.id || eventIndex + 1} - {currentEvent.type || "step"}
        </div>

        {/* Messages */}
        {currentEvent.messages && currentEvent.messages[lang] && (
          <div style={styles.messagesContainer}>
            {Array.isArray(currentEvent.messages[lang]) &&
              currentEvent.messages[lang].map((msg: string, idx: number) => (
                <div key={idx} style={styles.message}>
                  {msg}
                </div>
              ))}
          </div>
        )}

        {/* Event details */}
        <details style={{ marginTop: "1rem" }}>
          <summary style={styles.detailsSummary}>Show Details</summary>
          <pre style={styles.detailsContent}>
            {JSON.stringify(currentEvent, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}

/**
 * Render Questions tab - shows quiz questions as cards
 */
export function QuestionsRenderer({ response }: RendererProps) {
  const result = response?.result as any;
  const questions = result?.questions || [];

  if (!Array.isArray(questions) || questions.length === 0) {
    return <div style={styles.empty}>No questions available for this mode</div>;
  }

  return (
    <div>
      {questions.map((q: any, idx: number) => (
        <QuestionCard key={idx} question={q} index={idx} />
      ))}
    </div>
  );
}

function QuestionCard({ question, index }: { question: any; index: number }) {
  const [showAnswer, setShowAnswer] = React.useState(false);

  return (
    <div style={styles.questionCard}>
      <div style={styles.questionHeader}>Question {index + 1}</div>
      <div style={styles.questionText}>
        {question.question || question.text || JSON.stringify(question)}
      </div>

      {question.options && Array.isArray(question.options) && (
        <div style={styles.optionsContainer}>
          {question.options.map((opt: any, optIdx: number) => (
            <div
              key={optIdx}
              style={{
                ...styles.option,
                ...(question.correct === optIdx ? styles.optionCorrect : {}),
              }}
            >
              {String.fromCharCode(65 + optIdx)}) {typeof opt === "string" ? opt : opt.text || JSON.stringify(opt)}
            </div>
          ))}
        </div>
      )}

      {question.answer && (
        <div style={{ marginTop: "1rem" }}>
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            style={styles.toggleButton}
          >
            {showAnswer ? "Hide" : "Show"} Answer
          </button>
          {showAnswer && (
            <div style={styles.answer}>
              {question.answer}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Render Stats tab - shows statistics as cards
 */
export function StatsRenderer({ response }: RendererProps) {
  const stats = response?.stats || {};

  if (typeof stats !== "object" || Object.keys(stats).length === 0) {
    return <div style={styles.empty}>No statistics for this execution</div>;
  }

  return (
    <div style={styles.statsGrid}>
      {Object.entries(stats).map(([key, value]: [string, any]) => (
        <div key={key} style={styles.statCard}>
          <div style={styles.statLabel}>{key.replace(/_/g, " ")}</div>
          <div style={styles.statValue}>
            {typeof value === "number" ? value.toLocaleString() : String(value)}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Render Raw JSON tab
 */
export function RawJsonRenderer({ rawJson }: { rawJson: string | null }) {
  if (!rawJson) {
    return <div style={styles.empty}>No response data</div>;
  }

  return (
    <div>
      <button
        onClick={() => navigator.clipboard.writeText(rawJson)}
        style={styles.copyButton}
      >
        📋 Copy JSON
      </button>
      <pre style={styles.jsonBlock}>{rawJson}</pre>
    </div>
  );
}

/**
 * Render Logs tab
 */
export function LogsRenderer({ logs }: { logs: string[] }) {
  if (logs.length === 0) {
    return <div style={styles.empty}>No logs yet</div>;
  }

  return (
    <div style={styles.logsContainer}>
      {logs.map((log, idx) => (
        <div key={idx} style={styles.logEntry}>
          <span style={styles.logIndex}>[{idx + 1}]</span>
          {log}
        </div>
      ))}
    </div>
  );
}

// Styles
const styles = {
  empty: {
    padding: "2rem",
    textAlign: "center" as const,
    color: "#888",
    fontStyle: "italic" as const,
  },
  header: {
    background: "#1a3a1a",
    color: "#88ff88",
    padding: "12px",
    borderRadius: "8px 8px 0 0",
    fontWeight: "bold" as const,
    borderBottom: "2px solid #00ff88",
  },
  codeBlock: {
    background: "#0d1b0d",
    color: "#00ff88",
    padding: "18px",
    borderRadius: "0 0 8px 8px",
    fontSize: "15px",
    lineHeight: "1.6",
    fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
    overflowX: "auto" as const,
    whiteSpace: "pre" as const,
  },
  explainText: {
    background: "#1a1a2a",
    color: "#e0e0ff",
    padding: "18px",
    borderRadius: "0 0 8px 8px",
    fontSize: "16px",
    lineHeight: "1.6",
    whiteSpace: "pre-wrap" as const,
    fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Tahoma', 'Arial', sans-serif",
  },
  keyValueContainer: {
    background: "#1a1a1a",
    padding: "16px",
    borderRadius: "0 0 8px 8px",
  },
  keyValueRow: {
    padding: "8px 0",
    borderBottom: "1px solid #333",
  },
  key: {
    color: "#88ccff",
    fontWeight: "bold" as const,
    marginRight: "12px",
  },
  value: {
    color: "#cccccc",
    fontFamily: "monospace",
  },
  eventNav: {
    display: "flex",
    gap: "8px",
    marginBottom: "16px",
    alignItems: "center" as const,
  },
  navButton: {
    padding: "6px 12px",
    background: "#333",
    color: "#fff",
    border: "1px solid #555",
    borderRadius: "4px",
    cursor: "pointer" as const,
  },
  eventCounter: {
    color: "#aaa",
    fontSize: "14px",
    margin: "0 8px",
  },
  eventCard: {
    background: "#1a1a2a",
    borderRadius: "8px",
    padding: "16px",
    border: "2px solid #4488ff",
  },
  eventHeader: {
    color: "#88ccff",
    fontWeight: "bold" as const,
    fontSize: "16px",
    marginBottom: "12px",
  },
  messagesContainer: {
    marginTop: "12px",
  },
  message: {
    background: "#0d1a2a",
    padding: "10px 12px",
    marginBottom: "6px",
    borderRadius: "4px",
    color: "#88ccff",
    borderLeft: "3px solid #00ccff",
    fontSize: "14px",
    lineHeight: "1.5",
  },
  detailsSummary: {
    cursor: "pointer" as const,
    color: "#ff88ff",
    userSelect: "none" as const,
  },
  detailsContent: {
    background: "#1a0d1a",
    color: "#ff88ff",
    padding: "12px",
    borderRadius: "4px",
    fontSize: "13px",
    marginTop: "8px",
    overflowX: "auto" as const,
  },
  questionCard: {
    background: "#2a2a1a",
    border: "2px solid #ffaa00",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px",
  },
  questionHeader: {
    color: "#ffaa00",
    fontWeight: "bold" as const,
    marginBottom: "12px",
    fontSize: "16px",
  },
  questionText: {
    color: "#ffcc66",
    marginBottom: "12px",
    fontSize: "14px",
    lineHeight: "1.5",
  },
  optionsContainer: {
    marginTop: "12px",
  },
  option: {
    background: "#1a1a0d",
    padding: "8px 12px",
    marginBottom: "4px",
    borderRadius: "4px",
    color: "#ffdd88",
    border: "1px solid #444",
  },
  optionCorrect: {
    border: "2px solid #00ff88",
    background: "#0d1a0d",
  },
  toggleButton: {
    padding: "6px 12px",
    background: "#ffaa00",
    color: "#000",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer" as const,
    fontWeight: "bold" as const,
  },
  answer: {
    marginTop: "8px",
    padding: "12px",
    background: "#1a1a0d",
    color: "#ffcc66",
    borderRadius: "4px",
    borderLeft: "3px solid #00ff88",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
  },
  statCard: {
    background: "linear-gradient(135deg, #2a1a3a 0%, #1a1a2a 100%)",
    border: "2px solid #ff88ff",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center" as const,
  },
  statLabel: {
    color: "#ff88ff",
    fontSize: "12px",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
    marginBottom: "8px",
    fontWeight: "bold" as const,
  },
  statValue: {
    color: "#ffccff",
    fontSize: "32px",
    fontWeight: "bold" as const,
    fontFamily: "'Courier New', monospace",
  },
  jsonBlock: {
    background: "#1a1a1a",
    color: "#cccccc",
    padding: "16px",
    borderRadius: "8px",
    fontSize: "13px",
    overflowX: "auto" as const,
    whiteSpace: "pre" as const,
  },
  logsContainer: {
    background: "#0d1b0d",
    padding: "16px",
    borderRadius: "8px",
    maxHeight: "400px",
    overflowY: "auto" as const,
  },
  logEntry: {
    color: "#00ff88",
    fontFamily: "'Cascadia Code', monospace",
    fontSize: "12px",
    padding: "4px 0",
    borderBottom: "1px solid #1a3a1a",
  },
  logIndex: {
    color: "#888",
    marginRight: "8px",
  },
  copyButton: {
    padding: "8px 16px",
    background: "#0066cc",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer" as const,
    marginBottom: "12px",
    fontWeight: "bold" as const,
  },
};
