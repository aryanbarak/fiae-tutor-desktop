/**
 * Output renderers for different response types
 */

import React from "react";
import { CoreResponse } from "../domain/types";
import { VariantInfo } from "../state/model";
import { ExamSessionRenderer } from "./ExamSessionRenderer";

/**
 * Check if a language requires RTL (Right-to-Left) rendering
 */
function isRtlLang(lang: string): boolean {
  return lang === "fa" || lang === "ar" || lang === "he";
}

function blocksToText(blocks: any[]): string {
  if (!Array.isArray(blocks)) return "";
  const lines: string[] = [];
  for (const block of blocks) {
    if (!block || typeof block !== "object") continue;
    const type = block.type;
    const content = block.content;
    if (type === "list") {
      if (Array.isArray(content)) {
        for (const item of content) {
          lines.push(`- ${String(item)}`);
        }
      } else if (content !== undefined && content !== null) {
        lines.push(`- ${String(content)}`);
      }
      lines.push("");
    } else if (type === "code") {
      lines.push("```");
      lines.push(typeof content === "string" ? content : String(content ?? ""));
      lines.push("```");
      lines.push("");
    } else {
      if (content !== undefined && content !== null) {
        lines.push(typeof content === "string" ? content : String(content));
        lines.push("");
      }
    }
  }
  return lines.join("\n").trimEnd();
}

function renderBidiText(text: string, lang: string): React.ReactNode {
  if (!text) return text;
  if (lang !== "fa") return text;
  const parts = text.split(/([A-Za-z0-9_().+\-/*^=<>:]+)/);
  return (
    <>
      {parts.map((part, idx) =>
        idx % 2 === 1 ? (
          <bdi key={idx} dir="ltr" className="ltrToken">
            {part}
          </bdi>
        ) : (
          <span key={idx}>{part}</span>
        )
      )}
    </>
  );
}

function localizedText(value: any, lang: "de" | "fa" | "bi"): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const byLang = value[lang] ?? value.de ?? value.fa ?? value.text;
    if (typeof byLang === "string") return byLang;
  }
  if (value === null || value === undefined) return "";
  return String(value);
}

function variantTitle(v: any, lang: "de" | "fa" | "bi"): string {
  const title = localizedText(v?.title, lang);
  if (title.trim()) return title;
  const label = localizedText(v?.labels, lang);
  if (label.trim()) return label;
  if (typeof v?.id === "string" && v.id.trim()) return v.id;
  return "Variant";
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

function VariantSelectorComponent({
  variants,
  selectedVariantId,
  onVariantSelect,
}: {
  variants: any[];
  selectedVariantId: string | null;
  onVariantSelect: (id: string) => void;
}) {
  const selectedVariant = selectedVariantId
    ? variants.find((v) => v.id === selectedVariantId) || variants[0]
    : variants[0];

  return (
    <div style={styles.variantSelector}>
      <span style={styles.variantLabel}>Variants ({variants.length}):</span>
      <select
        value={selectedVariant?.id || variants[0]?.id}
        onChange={(e) => onVariantSelect(e.target.value)}
        style={styles.variantDropdown}
        aria-label="Select variant"
        title="Select variant"
      >
        {variants.map((v) => (
          <option key={v.id} value={v.id}>
            {String(v.title || v.id)}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Render Result tab - shows pseudocode, explain text, or structured data
 */
export function ResultRenderer({
  response,
  lang,
  availableVariants,
  selectedVariantId,
  onVariantSelect,
}: ResultRendererProps) {
  const [selectedPredictionTopic, setSelectedPredictionTopic] = React.useState<string | null>(null);
  const result = response?.result as any;
  const safeAvailableVariants: any[] = React.useMemo(
    () =>
      (Array.isArray(availableVariants) ? availableVariants : []).map((v, idx) => ({
        ...v,
        id: typeof v?.id === "string" && v.id.trim() ? v.id : `variant_${idx}`,
        title: variantTitle(v, lang),
      })),
    [availableVariants, lang]
  );

  React.useEffect(() => {
    setSelectedPredictionTopic(null);
  }, [
    result?.recommended_topic,
    Array.isArray(result?.predictions) ? result.predictions.length : 0,
  ]);

  if (!result) {
    return <div style={styles.empty}>No result data</div>;
  }

  if (result.exam_session) {
    return <ExamSessionRenderer result={result} lang={lang} />;
  }

  // Use variants from model state (stable) instead of response
  const hasVariants = safeAvailableVariants.length > 0;

  if (hasVariants) {
    const selectedVariant = selectedVariantId
      ? safeAvailableVariants.find((v) => v.id === selectedVariantId) || safeAvailableVariants[0]
      : safeAvailableVariants[0];

    if (selectedVariant.pseudocode) {
      const pseudocodeText = localizedText(selectedVariant.pseudocode, lang);
      const persianExplanation = localizedText(
        selectedVariant.explain_variant?.fa ?? selectedVariant.explain_variant,
        "fa"
      );

      return (
        <div>
          <VariantSelectorComponent
            variants={safeAvailableVariants}
            selectedVariantId={selectedVariantId}
            onVariantSelect={onVariantSelect}
          />
          <div style={styles.header}>
            {result.topic || "Algorithm"} - {variantTitle(selectedVariant, lang)}
          </div>

          <pre style={styles.codeBlock}>{pseudocodeText}</pre>
          <button
            onClick={() => navigator.clipboard.writeText(pseudocodeText)}
            style={styles.copyButton}
          >
            Copy Code
          </button>

          {persianExplanation && (
            <div
              style={{
                ...styles.variantExplain,
                direction: "rtl",
                textAlign: "right",
                unicodeBidi: "plaintext",
              }}
            >
              <div style={styles.variantExplainLabel}>توضیح فارسی این Variant</div>
              <div style={styles.variantExplainText} className="rtlText">
                {renderBidiText(persianExplanation, "fa")}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (selectedVariant.explain) {
      const isRTL = lang === "fa";
      const explainText = localizedText(selectedVariant.explain, lang);
      const goalText = localizedText(selectedVariant.goal, lang);
      const notesText = localizedText(selectedVariant.notes, lang);
      return (
        <div>
          <VariantSelectorComponent
            variants={safeAvailableVariants}
            selectedVariantId={selectedVariantId}
            onVariantSelect={onVariantSelect}
          />
          <div style={styles.header}>{variantTitle(selectedVariant, lang)}</div>
          <div
            style={{
              ...styles.explainText,
              direction: isRTL ? "rtl" : "ltr",
              textAlign: isRTL ? "right" : "left",
              unicodeBidi: "plaintext",
            }}
            className={isRTL ? "rtlText" : undefined}
          >
            {renderBidiText(explainText, lang)}
          </div>

          {goalText && (
            <div style={{ marginTop: "1rem" }}>
              <strong>{isRTL ? "هدف" : "Ziel"}:</strong> {goalText}
            </div>
          )}

          {notesText && (
            <div style={{ marginTop: "0.5rem", fontStyle: "italic" }}>
              <strong>{isRTL ? "نکته" : "Hinweis"}:</strong> {notesText}
            </div>
          )}

          {selectedVariant.exercises && selectedVariant.exercises.length > 0 && (
            <div style={{ marginTop: "1.5rem" }}>
              <strong>{isRTL ? "تمرینات" : "Übungen"}:</strong>
              {selectedVariant.exercises.map((ex: any, idx: number) => (
                <div key={idx} style={styles.exerciseCard}>
                  <div style={styles.exerciseTitle}>{localizedText(ex.title, lang) || ex.id}</div>
                  <div style={styles.exerciseTask}>
                    <strong>{isRTL ? "سؤال:" : "Aufgabe:"}</strong> {localizedText(ex.task, lang)}
                  </div>
                  {ex.solution && (
                    <details style={{ marginTop: "0.5rem" }}>
                      <summary style={{ cursor: "pointer", color: "#4CAF50" }}>
                        {isRTL ? "نمایش جواب" : "Lösung anzeigen"}
                      </summary>
                      <div
                        style={{
                          marginTop: "0.5rem",
                          padding: "0.5rem",
                          background: "#1a1a1a",
                          borderRadius: "4px",
                        }}
                      >
                        {localizedText(ex.solution, lang)}
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

    return (
      <div>
        <VariantSelectorComponent
          variants={safeAvailableVariants}
          selectedVariantId={selectedVariantId}
          onVariantSelect={onVariantSelect}
        />
        <div style={styles.empty}>Variant "{variantTitle(selectedVariant, lang)}" has no content</div>
      </div>
    );
  }

  if (result.error) {
    const looksLikeExplainLoadError =
      result.error === true ||
      typeof result.error_type === "string" ||
      typeof result.error_message === "string";

    if (looksLikeExplainLoadError) {
      return (
        <div>
          <div style={{ ...styles.header, backgroundColor: "#d32f2f" }}>
            Error Loading Explain Content
          </div>
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#ffebee",
              color: "#c62828",
              borderRadius: "4px",
              marginTop: "1rem",
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
            }}
          >
            <strong>Error Type:</strong> {result.error_type || "unknown"}
            <br />
            <strong>Message:</strong> {result.error_message || "Unknown error"}
          </div>
          <div style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#666" }}>
            <strong>Topic:</strong> {result.topic || "unknown"} |{" "}
            <strong>Language:</strong> {result.lang || "unknown"}
          </div>
        </div>
      );
    }

    const errorCode = String(result.error);
    const errorDetail =
      errorCode === "array_not_sorted"
        ? "Binary Search braucht ein sortiertes Array (aufsteigend oder absteigend), z. B. [1, 3, 5, 7, 9] oder [9, 7, 5, 3, 1]."
        : errorCode;

    return (
      <div>
        <div style={{ ...styles.header, backgroundColor: "#d32f2f" }}>Algorithm Error</div>
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#ffebee",
            color: "#c62828",
            borderRadius: "4px",
            marginTop: "1rem",
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
          }}
        >
          <strong>Error:</strong> {errorDetail}
        </div>
      </div>
    );
  }

  if (result.sections && Array.isArray(result.sections)) {
    const isRtl = isRtlLang(lang);

    if (result.sections.length === 0) {
      return (
        <div>
          <div style={styles.header}>💡 {result.title || "Explanation"}</div>
          <div style={{ ...styles.empty, color: "#ff9800" }}>
            ⚠️ No sections found in explain content. The sections array is empty.
          </div>
        </div>
      );
    }

    return (
      <div>
        <div style={styles.header}>💡 {result.title || "Explanation"}</div>
        <div style={styles.sectionsContainer}>
          {result.sections.map((section: any, idx: number) => {
            const sectionId = section.id || `section-${idx}`;
            const sectionTitle = localizedText(section.title, lang) || "Untitled Section";
            const sectionBodyRaw =
              section.body ??
              (Array.isArray(section.blocks) ? blocksToText(section.blocks) : "");
            const sectionBody = localizedText(sectionBodyRaw, lang);
            const sectionFormat = section.format || "md";
            void sectionFormat;
            const sectionRtl = section.rtl ?? isRtl;

            if (!sectionBody.trim()) {
              console.warn(`[ExplainRenderer] Section ${sectionId} has empty body!`);
              return (
                <div key={sectionId} style={{ ...styles.section, borderLeft: "3px solid #ff9800" }}>
                  <h3
                    style={{
                      ...styles.sectionTitle,
                      direction: sectionRtl ? "rtl" : "ltr",
                      textAlign: sectionRtl ? "right" : "left",
                    }}
                  >
                    {sectionTitle}
                  </h3>
                  <div style={{ color: "#ff9800", fontStyle: "italic" }}>
                    ⚠️ Section body is empty
                  </div>
                </div>
              );
            }

            return (
              <div key={sectionId} style={styles.section}>
                <h3
                  style={{
                    ...styles.sectionTitle,
                    direction: sectionRtl ? "rtl" : "ltr",
                    textAlign: sectionRtl ? "right" : "left",
                  }}
                >
                  {sectionTitle}
                </h3>
                <div
                  style={{
                    ...styles.sectionBody,
                    direction: sectionRtl ? "rtl" : "ltr",
                    textAlign: sectionRtl ? "right" : "left",
                    unicodeBidi: "plaintext",
                  }}
                  className={sectionRtl ? "rtlText" : undefined}
                >
                  {renderBidiText(sectionBody, lang)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Pattern detector / master_patterns format
  if (
    Object.prototype.hasOwnProperty.call(result, "predictions") &&
    Object.prototype.hasOwnProperty.call(result, "matched_keywords")
  ) {
    const isFa = lang === "fa";
    const templateKey = isFa ? "template_pseudocode_fa" : "template_pseudocode_de";
    const fallbackTemplateKey = isFa ? "template_pseudocode_de" : "template_pseudocode_fa";
    const templatePseudocode =
      (result?.[templateKey] as string) || (result?.[fallbackTemplateKey] as string) || "";
    const predictions = Array.isArray(result.predictions) ? result.predictions : [];
    const normalizedPredictions = predictions
      .filter((p: any) => p && typeof p === "object")
      .map((p: any) => ({
        topic: typeof p.topic === "string" ? p.topic : "unknown",
        score: typeof p.score === "number" ? p.score : 0,
        priority: typeof p.priority === "number" ? p.priority : 0,
        keywords: Array.isArray(p.keywords_found) ? p.keywords_found : [],
      }));
    const trapsKey = isFa ? "traps_fa" : "traps_de";
    const fallbackTrapsKey = isFa ? "traps_de" : "traps_fa";
    const traps =
      (Array.isArray(result?.[trapsKey]) ? result[trapsKey] : undefined) ||
      (Array.isArray(result?.[fallbackTrapsKey]) ? result[fallbackTrapsKey] : []);
    const trapsFa = Array.isArray(result?.traps_fa) ? result.traps_fa : [];
    const nextSteps = Array.isArray(result.next_steps) ? result.next_steps : [];
    const matchedKeywords =
      result.matched_keywords && typeof result.matched_keywords === "object"
        ? result.matched_keywords
        : {};
    const recommendedTopic =
      typeof result.recommended_topic === "string" && result.recommended_topic.trim()
        ? result.recommended_topic
        : "n/a";
    const activeTopic = selectedPredictionTopic || recommendedTopic;
    const isRecommendedActive = activeTopic === recommendedTopic;

    return (
      <div>
        <div style={styles.header}>🧭 Master Patterns</div>
        <div style={styles.sectionsContainer}>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Recommended Topic</h3>
            <div style={styles.sectionBody}>{recommendedTopic}</div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Predictions</h3>
            {normalizedPredictions.length > 0 ? (
              <div>
                {normalizedPredictions.map((p: any, idx: number) => (
                  <button
                    key={`${p.topic}-${idx}`}
                    onClick={() => setSelectedPredictionTopic(p.topic)}
                    style={{
                      ...styles.exerciseCard,
                      marginTop: idx === 0 ? 0 : "8px",
                      width: "100%",
                      textAlign: "left",
                      cursor: "pointer",
                      border: activeTopic === p.topic ? "2px solid #00ff88" : "1px solid #555",
                    }}
                  >
                    <div style={styles.exerciseTitle}>
                      {idx + 1}. {p.topic}
                    </div>
                    <div style={styles.exerciseTask}>
                      score={p.score}, priority={p.priority}
                    </div>
                    <div style={{ ...styles.exerciseTask, marginTop: "6px" }}>
                      keywords: {p.keywords.length > 0 ? p.keywords.join(", ") : "none"}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div style={styles.sectionBody}>No predictions</div>
            )}
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Matched Keywords (All Topics)</h3>
            {Object.keys(matchedKeywords).length > 0 ? (
              <pre style={styles.jsonBlock}>{JSON.stringify(matchedKeywords, null, 2)}</pre>
            ) : (
              <div style={styles.sectionBody}>No keyword matches</div>
            )}
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Template Pseudocode</h3>
            {templatePseudocode && isRecommendedActive ? (
              <>
                <pre style={styles.codeBlock}>{templatePseudocode}</pre>
                <button
                  onClick={() => navigator.clipboard.writeText(templatePseudocode)}
                  style={styles.copyButton}
                >
                  Copy Code
                </button>
              </>
            ) : (
              <div style={styles.sectionBody}>
                {isRecommendedActive
                  ? "No template pseudocode available"
                  : `No template returned for '${activeTopic}'. Select '${recommendedTopic}' or run that topic directly.`}
              </div>
            )}
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Common Traps</h3>
            {traps.length > 0 && isRecommendedActive ? (
              <ul style={styles.examList}>
                {traps.map((item: string, idx: number) => (
                  <li key={idx} style={styles.examListItem}>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <div style={styles.sectionBody}>
                {isRecommendedActive
                  ? "No traps"
                  : `No trap list returned for '${activeTopic}'.`}
              </div>
            )}
          </div>

          {trapsFa.length > 0 && !isFa && isRecommendedActive && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>توضیح فارسی</h3>
              <ul style={styles.examList}>
                {trapsFa.map((item: string, idx: number) => (
                  <li
                    key={idx}
                    style={{
                      ...styles.examListItem,
                      direction: "rtl",
                      textAlign: "right",
                      unicodeBidi: "plaintext",
                    }}
                  >
                    {renderBidiText(item, "fa")}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div
            style={{ ...styles.section, borderBottom: "none", marginBottom: 0, paddingBottom: 0 }}
          >
            <h3 style={styles.sectionTitle}>Next Steps</h3>
            {nextSteps.length > 0 && isRecommendedActive ? (
              <ul style={styles.examList}>
                {nextSteps.map((item: string, idx: number) => (
                  <li key={idx} style={styles.examListItem}>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <div style={styles.sectionBody}>
                {isRecommendedActive
                  ? "No next steps"
                  : `Choose '${activeTopic}' in Topic dropdown and run to get full content.`}
              </div>
            )}
          </div>
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
          Copy Code
        </button>
      </div>
    );
  }

  if (
    Array.isArray(result.sorted) &&
    (typeof result.algorithm === "string" || typeof result.variant === "string")
  ) {
    return (
      <div>
        <div style={styles.header}>
          📍 Trace Summary {result.algorithm ? `- ${result.algorithm}` : ""}
        </div>
        <div style={styles.keyValueContainer}>
          <div style={styles.keyValueRow}>
            <span style={styles.key}>sorted:</span>
            <span style={styles.value}>{JSON.stringify(result.sorted)}</span>
          </div>
          {typeof result.variant === "string" && (
            <div style={styles.keyValueRow}>
              <span style={styles.key}>variant:</span>
              <span style={styles.value}>{result.variant}</span>
            </div>
          )}
          {typeof result.passes === "number" && (
            <div style={styles.keyValueRow}>
              <span style={styles.key}>passes:</span>
              <span style={styles.value}>{String(result.passes)}</span>
            </div>
          )}
        </div>
        <div style={{ marginTop: "0.75rem", color: "#88ccff" }}>
          Open <b>Events</b> tab for step-by-step trace.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ ...styles.header, backgroundColor: "#ff9800" }}>
        ⚠️ Unexpected Result Format
      </div>
      <div style={{ marginTop: "1rem", color: "#ff6f00" }}>
        The result does not match any known format (sections, pseudocode, etc). This likely
        indicates a schema issue or unsupported mode.
      </div>
      <div style={styles.keyValueContainer}>
        {Object.entries(result).map(([key, value]) => (
          <div key={key} style={styles.keyValueRow}>
            <span style={styles.key}>{key}:</span>
            <span style={styles.value}>
              {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Render Schreibtischtest tab - desk-check table from trace events
 */
export function SchreibtischtestRenderer({ response }: BaseRendererProps) {
  const result = (response?.result as any) || {};
  const examRows = Array.isArray(result?.trace_exam_rows) ? result.trace_exam_rows : [];
  const events = Array.isArray(response?.events) ? response.events : [];
  if (examRows.length === 0 && events.length === 0) {
    return <div style={styles.empty}>No events available for Schreibtischtest</div>;
  }

  const startEvent = events.find((ev: any) => ev?.type === "start");
  const baseArray = Array.isArray(startEvent?.state?.array) ? startEvent.state.array : [];

  const passRows =
    events
      .filter((ev: any) => ev?.type === "pass_end")
      .map((ev: any, idx: number) => {
        const passIdx = typeof ev?.pass === "number" ? ev.pass : idx;
        const state = (ev && typeof ev === "object" ? ev.state : {}) || {};
        const arr = Array.isArray(state.array) ? JSON.stringify(state.array) : "";
        const rangeEnd =
          ev?.action?.details?.range_end ??
          (Array.isArray(state.array) ? state.array.length - 2 - passIdx : "");
        const range = rangeEnd === "" ? "" : `[0..${rangeEnd}]`;
        const note = ev?.messages?.de || ev?.messages?.fa || "Pass abgeschlossen";

        return {
          step: idx,
          pass: passIdx + 1,
          range,
          array: arr,
          note: String(note),
        };
      }) || [];

  const iterationRows =
    events
      .filter((ev: any) => {
        if (ev?.type === "step" && ev?.state?.indices) return true;
        if (ev?.type === "compare" && typeof ev?.state?.i === "number") return true;
        return false;
      })
      .map((ev: any, idx: number) => {
        const arr = baseArray.length > 0 ? JSON.stringify(baseArray) : "";

        if (ev?.type === "step" && ev?.state?.indices) {
          const indices = ev.state.indices || {};
          const low = indices.low;
          const high = indices.high;
          const mid = indices.mid;
          const range =
            typeof low === "number" && typeof high === "number" ? `[${low}..${high}]` : "";
          const noteParts = [
            typeof mid === "number" ? `mid=${mid}` : "",
            ev?.messages?.de || ev?.messages?.fa || "Iteration",
          ].filter(Boolean);

          return {
            step: idx,
            pass: idx + 1,
            range,
            array: arr,
            note: noteParts.join(" | "),
          };
        }

        const i = ev?.state?.i;
        const value = ev?.state?.value;
        return {
          step: idx,
          pass: idx + 1,
          range: typeof i === "number" ? `[${i}..${i}]` : "",
          array: arr,
          note:
            ev?.messages?.de ||
            ev?.messages?.fa ||
            (typeof i === "number" ? `compare i=${i}, value=${value}` : "Iteration"),
        };
      }) || [];

  const rows =
    examRows.length > 0
      ? examRows.map((r: any, idx: number) => ({
          step: typeof r?.step === "number" ? r.step : idx,
          pass: typeof r?.pass === "number" ? r.pass : idx + 1,
          range: String(r?.range ?? ""),
          array: Array.isArray(r?.array) ? JSON.stringify(r.array) : String(r?.array ?? ""),
          note: String(r?.note ?? ""),
        }))
      : passRows.length > 0
      ? passRows
      : iterationRows;

  const hasPassRows = examRows.length > 0 || passRows.length > 0;
  const summaryText = hasPassRows
    ? "IHK desk-check style: pass summary only (after each pass)."
    : "IHK desk-check style: iteration summary (for search/step-based traces).";

  return (
    <div>
      <div style={styles.header}>Schreibtischtest</div>
      <div style={styles.sectionsContainer}>
        <div style={styles.sectionBody}>{summaryText}</div>
        <div style={{ overflowX: "auto", marginTop: "12px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={styles.examTableHeader}>{hasPassRows ? "Pass" : "Iteration"}</th>
                <th style={styles.examTableHeader}>Range</th>
                <th style={styles.examTableHeader}>{hasPassRows ? "Array after pass" : "Array"}</th>
                <th style={styles.examTableHeader}>Note</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={`${r.step}-${r.pass}-${r.range}`}>
                  <td style={styles.examTableCell}>{r.pass}</td>
                  <td style={styles.examTableCell}>{r.range}</td>
                  <td style={{ ...styles.examTableCell, fontFamily: "monospace" }}>{r.array}</td>
                  <td style={styles.examTableCell}>{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

      <div style={styles.eventCard}>
        <div style={styles.eventHeader}>
          Event #{currentEvent.id || eventIndex + 1} - {currentEvent.type || "step"}
        </div>

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

        <details style={{ marginTop: "1rem" }}>
          <summary style={styles.detailsSummary}>Show Details</summary>
          <pre style={styles.detailsContent}>{JSON.stringify(currentEvent, null, 2)}</pre>
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
              {String.fromCharCode(65 + optIdx)}){" "}
              {typeof opt === "string" ? opt : opt.text || JSON.stringify(opt)}
            </div>
          ))}
        </div>
      )}

      {question.answer && (
        <div style={{ marginTop: "1rem" }}>
          <button onClick={() => setShowAnswer(!showAnswer)} style={styles.toggleButton}>
            {showAnswer ? "Hide" : "Show"} Answer
          </button>
          {showAnswer && <div style={styles.answer}>{question.answer}</div>}
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
      <button onClick={() => navigator.clipboard.writeText(rawJson)} style={styles.copyButton}>
        Copy JSON
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
    direction: "ltr" as const,
    textAlign: "left" as const,
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
    direction: "ltr" as const,
    textAlign: "left" as const,
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
  examSection: {
    marginTop: "16px",
    padding: "12px",
    background: "#1a1a2a",
    borderRadius: "8px",
    border: "1px solid #4488ff",
  },
  examLabel: {
    color: "#88ccff",
    fontWeight: "bold" as const,
    marginBottom: "8px",
  },
  examList: {
    margin: 0,
    paddingLeft: "20px",
  },
  examListItem: {
    color: "#e0e0ff",
    marginBottom: "6px",
  },
  examTableHeader: {
    textAlign: "left" as const,
    padding: "6px",
    color: "#88ccff",
    borderBottom: "1px solid #333",
    fontSize: "12px",
  },
  examTableCell: {
    padding: "6px",
    borderBottom: "1px solid #222",
    color: "#e0e0ff",
    fontSize: "12px",
  },
};
