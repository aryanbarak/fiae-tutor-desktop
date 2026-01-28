/**
 * Output renderers for different response types
 */

import React from "react";
import { CoreResponse } from "../domain/types";
import { VariantInfo } from "../state/model";

/**
 * Debug UI flag - enables inspector panels for developers
 */
const DEBUG_UI = import.meta.env.VITE_DEBUG_UI === "true";

/**
 * Check if a language requires RTL (Right-to-Left) rendering
 */
function isRtlLang(lang: string): boolean {
  return lang === "fa" || lang === "ar" || lang === "he";
}

interface BaseRendererProps {
  response: CoreResponse;
  lang: "de" | "fa" | "bi";
}

interface ResultRendererProps extends BaseRendererProps {
  availableVariants: VariantInfo[];
  selectedVariantId: string | null;
  onVariantSelect: (variantId: string) => void;
}

/**
 * Render Result tab - shows pseudocode, explain text, or structured data
 * Now supports multi-variant display with stable state
 */
export function ResultRenderer({ 
  response, 
  lang, 
  availableVariants, 
  selectedVariantId, 
  onVariantSelect 
}: ResultRendererProps) {
  const result = response?.result as any;

  if (!result) {
    return <div style={styles.empty}>No result data</div>;
  }

  // Use variants from model state (stable) instead of response
  const hasVariants = availableVariants.length > 0;
  
  // Variant Selector Component (reusable)
  const VariantSelector = () => {
    if (!hasVariants) return null;
    
    const selectedVariant = selectedVariantId 
      ? availableVariants.find(v => v.id === selectedVariantId) || availableVariants[0]
      : availableVariants[0];
    
    return (
      <div style={styles.variantSelector}>
        <span style={styles.variantLabel}>📚 Variants ({availableVariants.length}):</span>
        <select
          value={selectedVariant?.id || availableVariants[0]?.id}
          onChange={(e) => onVariantSelect(e.target.value)}
          style={styles.variantDropdown}
        >
          {availableVariants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.title || v.id}
            </option>
          ))}
        </select>
      </div>
    );
  };

  if (hasVariants) {
    // Find the selected variant, or default to first
    const selectedVariant = selectedVariantId 
      ? availableVariants.find(v => v.id === selectedVariantId) || availableVariants[0]
      : availableVariants[0];
    
    // Pseudocode mode with variants
    if (selectedVariant.pseudocode) {
      const persianExplanation = selectedVariant.explain_variant?.fa;
      
      return (
        <div>
          <VariantSelector />
          {/* Selected Variant Content */}
          <div style={styles.header}>
            📝 {result.topic || "Algorithm"} - {selectedVariant.title || selectedVariant.id}
          </div>
          
          {/* Pseudocode Block */}
          <pre style={styles.codeBlock}>{selectedVariant.pseudocode}</pre>
          <button
            onClick={() => navigator.clipboard.writeText(selectedVariant.pseudocode)}
            style={styles.copyButton}
          >
            📋 Copy Code
          </button>
          
          {/* Persian Variant Explanation (shown below pseudocode when available) */}
          {persianExplanation && (
            <div style={{
              ...styles.variantExplain,
              direction: "rtl",
              textAlign: "right",
              unicodeBidi: "plaintext",
            }}>
              <div style={styles.variantExplainLabel}>
                📘 توضیح فارسی این Variant
              </div>
              <div style={styles.variantExplainText}>
                {persianExplanation}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Explain mode with variants
    if (selectedVariant.explain) {
      const isRTL = lang === "fa";
      return (
        <div>
          <VariantSelector />
          {/* Selected Variant Content */}
          <div style={styles.header}>💡 {selectedVariant.title || selectedVariant.id}</div>
          <div style={{
            ...styles.explainText, 
            direction: isRTL ? "rtl" : "ltr", 
            textAlign: isRTL ? "right" : "left",
            unicodeBidi: "plaintext",
          }}>
            {selectedVariant.explain}
          </div>

          {/* Goal */}
          {selectedVariant.goal && (
            <div style={{marginTop: "1rem"}}>
              <strong>🎯 {isRTL ? "هدف" : "Ziel"}:</strong> {selectedVariant.goal}
            </div>
          )}

          {/* Notes */}
          {selectedVariant.notes && (
            <div style={{marginTop: "0.5rem", fontStyle: "italic"}}>
              <strong>💡 {isRTL ? "نکته" : "Hinweis"}:</strong> {selectedVariant.notes}
            </div>
          )}

          {/* Exercises */}
          {selectedVariant.exercises && selectedVariant.exercises.length > 0 && (
            <div style={{marginTop: "1.5rem"}}>
              <strong>📝 {isRTL ? "تمرینات" : "Übungen"}:</strong>
              {selectedVariant.exercises.map((ex: any, idx: number) => (
                <div key={idx} style={styles.exerciseCard}>
                  <div style={styles.exerciseTitle}>
                    {ex.title?.[lang] || ex.title?.de || ex.id}
                  </div>
                  <div style={styles.exerciseTask}>
                    <strong>{isRTL ? "سوال:" : "Aufgabe:"}</strong> {ex.task?.[lang] || ex.task?.de}
                  </div>
                  {ex.solution && (
                    <details style={{marginTop: "0.5rem"}}>
                      <summary style={{cursor: "pointer", color: "#4CAF50"}}>
                        {isRTL ? "نمایش جواب" : "Lösung anzeigen"}
                      </summary>
                      <div style={{marginTop: "0.5rem", padding: "0.5rem", background: "#1a1a1a", borderRadius: "4px"}}>
                        {ex.solution?.[lang] || ex.solution?.de}
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    // If variant has no content, show fallback WITH variant selector still visible
    return (
      <div>
        <VariantSelector />
        <div style={styles.empty}>
          Variant "{selectedVariant.title || selectedVariant.id}" has no content
        </div>
      </div>
    );
  }

  // NEW: Explain Core v1.0 - structured sections rendering
  if (result.sections && Array.isArray(result.sections)) {
    const isRtl = isRtlLang(lang);
    return (
      <div>
        <div style={styles.header}>💡 {result.title || "Explanation"}</div>
        <div style={styles.sectionsContainer}>
          {result.sections.map((section: any, idx: number) => {
            const sectionRtl = section.rtl ?? isRtl;
            return (
              <div key={section.id || idx} style={styles.section}>
                <h3 style={{
                  ...styles.sectionTitle,
                  direction: sectionRtl ? "rtl" : "ltr",
                  textAlign: sectionRtl ? "right" : "left",
                }}>
                  {section.title}
                </h3>
                <div style={{
                  ...styles.sectionBody,
                  direction: sectionRtl ? "rtl" : "ltr",
                  textAlign: sectionRtl ? "right" : "left",
                  unicodeBidi: "plaintext",
                }}>
                  {section.body}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Legacy single-variant pseudocode mode
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

  // Legacy explain mode - check FIRST before fallback
  if (result.explain && typeof result.explain === "string") {
    const isRtl = isRtlLang(lang);
    return (
      <div>
        <div style={styles.header}>💡 Explanation</div>
        <div style={{
          ...styles.explainText,
          direction: isRtl ? "rtl" : "ltr",
          textAlign: isRtl ? "right" : "left",
          unicodeBidi: "plaintext",
        }}>
          {result.explain}
        </div>
        {/* Debug inspector - only visible in DEBUG_UI mode */}
        {DEBUG_UI && Object.keys(result).length > 1 && (
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
}: BaseRendererProps & {
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
export function QuestionsRenderer({ response }: BaseRendererProps) {
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
export function StatsRenderer({ response }: BaseRendererProps) {
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
  sectionsContainer: {
    background: "#1a1a2a",
    borderRadius: "0 0 8px 8px",
    padding: "12px",
  },
  section: {
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: "1px solid #333",
  },
  sectionTitle: {
    color: "#88ff88",
    fontSize: "18px",
    fontWeight: "bold" as const,
    marginBottom: "12px",
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
  sectionBody: {
    color: "#e0e0ff",
    fontSize: "15px",
    lineHeight: "1.7",
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
  variantSelector: {
    display: "flex",
    alignItems: "center" as const,
    gap: "12px",
    marginBottom: "16px",
    padding: "12px",
    background: "#1a1a2a",
    borderRadius: "8px",
    border: "1px solid #4488ff",
  },
  variantLabel: {
    color: "#88ccff",
    fontWeight: "bold" as const,
    fontSize: "14px",
  },
  variantDropdown: {
    flex: 1,
    padding: "8px 12px",
    background: "#0d1a2a",
    color: "#fff",
    border: "1px solid #555",
    borderRadius: "4px",
    fontSize: "14px",
    cursor: "pointer" as const,
  },
  variantExplain: {
    marginTop: "16px",
    padding: "16px",
    background: "#1a2a1a",
    borderRadius: "8px",
    border: "2px solid #66bb66",
  },
  variantExplainLabel: {
    color: "#88ff88",
    fontWeight: "bold" as const,
    fontSize: "14px",
    marginBottom: "8px",
  },
  variantExplainText: {
    color: "#ccffcc",
    fontSize: "14px",
    lineHeight: "1.6",
    whiteSpace: "pre-wrap" as const,
  },
  exerciseCard: {
    background: "#1a1a2a",
    padding: "12px",
    marginTop: "12px",
    borderRadius: "6px",
    border: "1px solid #555",
  },
  exerciseTitle: {
    color: "#88ccff",
    fontWeight: "bold" as const,
    fontSize: "15px",
    marginBottom: "8px",
  },
  exerciseTask: {
    color: "#e0e0ff",
    lineHeight: "1.6",
  },
};
