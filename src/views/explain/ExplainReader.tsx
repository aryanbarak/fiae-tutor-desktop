/**
 * Main reader area for Explain Mode
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { TopicId, isTopicId } from "../../domain/topicRegistry";
import { ResultRenderer } from "../../components/renderers";
import { ExplainError } from "./ExplainError";
import { explainTheme } from "./explainTheme";
import { VariantInfo } from "../../state/model";
import { PatternAlgorithmGraph } from "../../features/explain/graph/PatternAlgorithmGraph";

interface ExplainReaderProps {
  topic: TopicId;
  viewMode: "algorithms" | "patterns";
  response: any;
  error: string | null;
  status: "idle" | "running" | "success" | "error";
  lang: "de" | "fa" | "bi";
  availableVariants: VariantInfo[];
  selectedVariantId: string | null;
  onVariantSelect: (variantId: string) => void;
  onVariantRunRequested?: (variantId: string) => void;
  onRelatedTopicSelect: (topicId: TopicId) => void;
  onRetry?: () => void;
}

const MASTER_PATTERN_FALLBACKS: { id: string; label: string }[] = [
  { id: "p01_search_contains", label: "P01 Search/Contains" },
  { id: "p02_count_filter", label: "P02 Count/Filter" },
  { id: "p03_min_max_avg", label: "P03 Min/Max/Avg" },
  { id: "p04_two_index_window", label: "P04 Two-index window" },
  { id: "p05_sorted_binary_search", label: "P05 Binary Search" },
  { id: "p06_stability", label: "P06 Stability" },
];

const MASTER_PATTERN_LINKS: Record<string, TopicId[]> = {
  p01_search_contains: ["linearsearch", "search_contains"],
  p02_count_filter: ["count_condition"],
  p03_min_max_avg: ["minmax_avg", "minimum"],
  p04_two_index_window: ["search_contains"],
  p05_sorted_binary_search: ["binarysearch"],
  p06_stability: ["bubblesort", "insertionsort", "selectionsort"],
};

function pickLocalizedLabel(value: any, lang: "de" | "fa" | "bi"): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const byLang = value[lang] ?? value.de ?? value.fa ?? value.label ?? value.text;
    if (typeof byLang === "string") return byLang;
  }
  if (value === null || value === undefined) return "";
  return String(value);
}

function toTopicIds(items: unknown): TopicId[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<TopicId>();
  const out: TopicId[] = [];
  for (const item of items) {
    const normalized = String(item).trim().toLowerCase();
    if (!isTopicId(normalized)) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function buildStructuredPatternLinks(response: any, availableVariants: VariantInfo[]): Map<string, TopicId[]> {
  const links = new Map<string, TopicId[]>();
  const result = response?.result;
  const responseVariants = Array.isArray(result?.variants) ? result.variants : [];

  for (const variant of responseVariants) {
    const variantId = String(variant?.id || "");
    if (!variantId) continue;
    const topics = toTopicIds(variant?.related_topics);
    if (topics.length > 0) {
      links.set(variantId, topics);
    }
  }

  for (const variant of availableVariants) {
    const variantId = String((variant as any)?.id || "");
    if (!variantId || links.has(variantId)) continue;
    const topics = toTopicIds((variant as any)?.related_topics);
    if (topics.length > 0) {
      links.set(variantId, topics);
    }
  }

  return links;
}

function extractRelatedTopicIds(
  topic: TopicId,
  response: any,
  availableVariants: VariantInfo[],
  selectedVariantId: string | null
): TopicId[] {
  const structuredLinks = buildStructuredPatternLinks(response, availableVariants);

  if (topic === "master_patterns") {
    if (selectedVariantId) {
      const structured = structuredLinks.get(selectedVariantId);
      if (structured && structured.length > 0) {
        return structured;
      }
      return MASTER_PATTERN_LINKS[selectedVariantId] || [];
    }
    return [];
  }

  const result = response?.result;
  return toTopicIds(result?.related_topics);
}

function buildPatternLinksMap(
  topic: TopicId,
  response: any,
  availableVariants: VariantInfo[],
  patternItems: { id: string; label: string }[]
): Map<string, TopicId[]> {
  const map = new Map<string, TopicId[]>();
  const structuredLinks = buildStructuredPatternLinks(response, availableVariants);

  if (topic === "master_patterns") {
    for (const pattern of patternItems) {
      const structured = structuredLinks.get(pattern.id);
      if (structured && structured.length > 0) {
        map.set(pattern.id, structured);
        continue;
      }
      map.set(pattern.id, MASTER_PATTERN_LINKS[pattern.id] || []);
    }
    return map;
  }

  if (patternItems.length > 0) {
    map.set(patternItems[0].id, extractRelatedTopicIds(topic, response, availableVariants, patternItems[0].id));
  }
  return map;
}


function buildPatternItems(
  topic: TopicId,
  availableVariants: VariantInfo[],
  response: any
): { id: string; label: string }[] {
  if (availableVariants.length > 0) {
    return availableVariants.map((variant, idx) => ({
      id: variant.id || `pattern_${idx}`,
      label: pickLocalizedLabel((variant as any).title, "de") || variant.id || `Pattern ${idx + 1}`,
    }));
  }

  const result = response?.result;
  const variants = Array.isArray(result?.variants) ? result.variants : [];
  if (variants.length > 0) {
    return variants.map((variant: any, idx: number) => ({
      id: variant?.id || `pattern_${idx}`,
      label: pickLocalizedLabel(variant?.title, "de") || variant?.id || `Pattern ${idx + 1}`,
    }));
  }

  if (topic === "master_patterns") {
    return MASTER_PATTERN_FALLBACKS;
  }

  return [];
}

export function ExplainReader({
  topic,
  viewMode,
  response,
  error,
  status,
  lang,
  availableVariants,
  selectedVariantId,
  onVariantSelect,
  onVariantRunRequested,
  onRelatedTopicSelect,
  onRetry,
}: ExplainReaderProps) {
  const [activeTab, setActiveTab] = useState<"result" | "graph">("result");
  const patterns = useMemo(
    () => buildPatternItems(topic, availableVariants, response),
    [availableVariants, response, topic]
  );
  const [focusedPatternId, setFocusedPatternId] = useState<string | null>(null);
  const previousSelectedVariantRef = useRef<string | null>(null);
  const effectivePatternId = selectedVariantId || focusedPatternId || patterns[0]?.id || null;
  const patternLinksMap = useMemo(
    () => buildPatternLinksMap(topic, response, availableVariants, patterns),
    [availableVariants, patterns, response, topic]
  );
  const allGraphEdges = useMemo(
    () =>
      patterns.flatMap((pattern) => {
        const related = patternLinksMap.get(pattern.id) || [];
        return related.map((topicId) => ({
          fromPatternId: pattern.id,
          toAlgorithmId: topicId,
        }));
      }),
    [patternLinksMap, patterns]
  );
  const graphAlgorithmIds = useMemo(() => {
    const seen = new Set<TopicId>();
    const out: TopicId[] = [];
    for (const edge of allGraphEdges) {
      if (seen.has(edge.toAlgorithmId)) continue;
      seen.add(edge.toAlgorithmId);
      out.push(edge.toAlgorithmId);
    }
    return out;
  }, [allGraphEdges]);
  const relatedTopicIds = useMemo(
    () => extractRelatedTopicIds(topic, response, availableVariants, effectivePatternId),
    [availableVariants, effectivePatternId, response, topic]
  );
  const showGraphEntry = topic === "master_patterns" || viewMode === "patterns";

  useEffect(() => {
    if (!selectedVariantId) return;
    if (selectedVariantId === previousSelectedVariantRef.current) return;
    setFocusedPatternId(selectedVariantId);
    previousSelectedVariantRef.current = selectedVariantId;
  }, [selectedVariantId]);

  useEffect(() => {
    if (!focusedPatternId) return;
    const exists = patterns.some((pattern) => pattern.id === focusedPatternId);
    if (!exists) {
      setFocusedPatternId(null);
    }
  }, [focusedPatternId, patterns]);

  if (status === "error" && error) {
    return <ExplainError error={error} onRetry={onRetry} />;
  }

  if (status === "running") {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}>⏳</div>
        <div style={styles.loadingText}>Loading explanation...</div>
      </div>
    );
  }

  if (!response && (status === "idle" || status === "error")) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}>📚</div>
        <div style={styles.emptyText}>
          Select a topic and click Run to view the explanation
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {showGraphEntry && (
          <div style={styles.tabBar}>
            <button
              type="button"
              onClick={() => setActiveTab("result")}
              style={{
                ...styles.tabButton,
                ...(activeTab === "result" ? styles.tabButtonActive : {}),
              }}
            >
              Result
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("graph")}
              style={{
                ...styles.tabButton,
                ...(activeTab === "graph" ? styles.tabButtonActive : {}),
              }}
            >
              Graph
            </button>
          </div>
        )}
        {activeTab === "result" && (
          <>
            <ResultRenderer
              response={response}
              lang={lang}
              availableVariants={availableVariants}
              selectedVariantId={selectedVariantId}
              onVariantSelect={onVariantSelect}
            />
            {relatedTopicIds.length > 0 && (
              <div style={styles.relatedPanel}>
                <div style={styles.relatedTitle}>Related Algorithms</div>
                <div style={styles.relatedList}>
                  {relatedTopicIds.map((topicId) => (
                    <button
                      key={topicId}
                      type="button"
                      style={styles.relatedChip}
                      onClick={() => onRelatedTopicSelect(topicId)}
                    >
                      {topicId}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        {showGraphEntry && activeTab === "graph" && (
          <PatternAlgorithmGraph
            focusedPatternId={focusedPatternId}
            patternItems={patterns}
            algorithmIds={graphAlgorithmIds}
            edges={allGraphEdges}
            onPatternSelect={(variantId) => {
              setFocusedPatternId(variantId);
              if (onVariantRunRequested) {
                onVariantRunRequested(variantId);
                return;
              }
              onVariantSelect(variantId);
            }}
            onAlgorithmSelect={onRelatedTopicSelect}
            onResetFocus={() => setFocusedPatternId(null)}
          />
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    flex: 1,
    overflowY: "auto" as const,
    background: "#0a0a0a",
  },
  content: {
    maxWidth: explainTheme.reader.maxWidth,
    margin: "0 auto",
    padding: explainTheme.reader.padding,
  },
  tabBar: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1rem",
  },
  tabButton: {
    padding: "0.45rem 0.9rem",
    borderRadius: "6px",
    border: "1px solid #35525f",
    background: "#11151d",
    color: "#b6d4f0",
    cursor: "pointer" as const,
    fontWeight: "bold" as const,
    fontSize: "12px",
  },
  tabButtonActive: {
    background: "#1f2f44",
    borderColor: "#5f8dbe",
    color: "#d9ecff",
  },
  relatedPanel: {
    marginTop: "1.25rem",
    padding: "1rem",
    border: "1px solid #2f4f2f",
    borderRadius: "8px",
    background: "#111b11",
  },
  relatedTitle: {
    color: "#95f7b2",
    fontWeight: "bold" as const,
    marginBottom: "0.75rem",
  },
  relatedList: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "0.5rem",
  },
  relatedChip: {
    border: "1px solid #447a5a",
    borderRadius: "999px",
    background: "#1f2d22",
    color: "#d8ffe5",
    fontSize: "12px",
    padding: "0.3rem 0.7rem",
    cursor: "pointer" as const,
  },
  loading: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "400px",
  },
  spinner: {
    fontSize: "48px",
    marginBottom: "1rem",
  },
  loadingText: {
    color: "#6699ff",
    fontSize: "16px",
  },
  empty: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "400px",
    color: "#666",
  },
  emptyIcon: {
    fontSize: "64px",
    marginBottom: "1rem",
  },
  emptyText: {
    fontSize: "16px",
    fontStyle: "italic" as const,
  },
};
