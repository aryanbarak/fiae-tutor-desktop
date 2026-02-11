/**
 * Main reader area for Explain Mode
 */

import { useState } from "react";
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
  onVariantRunRequested?: () => void;
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
function extractRelatedTopicIds(response: any, selectedVariantId: string | null): TopicId[] {
  const result = response?.result;
  const variants = Array.isArray(result?.variants) ? result.variants : [];

  if (selectedVariantId && variants.length > 0) {
    const selected = variants.find((variant: any) => variant?.id === selectedVariantId);
    const scoped = selected?.related_topics;
    if (Array.isArray(scoped)) {
      return scoped
        .map((item) => String(item).trim().toLowerCase())
        .filter((item): item is TopicId => isTopicId(item));
    }
  }

  const related = result?.related_topics;
  if (!Array.isArray(related)) return [];
  return related
    .map((item) => String(item).trim().toLowerCase())
    .filter((item): item is TopicId => isTopicId(item));
}


function buildPatternItems(
  topic: TopicId,
  availableVariants: VariantInfo[],
  response: any
): { id: string; label: string }[] {
  if (availableVariants.length > 0) {
    return availableVariants.map((variant, idx) => ({
      id: variant.id || `pattern_${idx}`,
      label: variant.title || variant.id || `Pattern ${idx + 1}`,
    }));
  }

  const result = response?.result;
  const variants = Array.isArray(result?.variants) ? result.variants : [];
  if (variants.length > 0) {
    return variants.map((variant: any, idx: number) => ({
      id: variant?.id || `pattern_${idx}`,
      label: variant?.title || variant?.id || `Pattern ${idx + 1}`,
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
  const [graphPatternId, setGraphPatternId] = useState<string | null>(null);

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

  const patterns = buildPatternItems(topic, availableVariants, response);
  const effectivePatternId = selectedVariantId || graphPatternId || patterns[0]?.id || null;
  const relatedTopicIds = extractRelatedTopicIds(response, effectivePatternId);
  const graphEdges = effectivePatternId
    ? relatedTopicIds.map((topicId) => ({
        fromPatternId: effectivePatternId,
        toAlgorithmId: topicId,
      }))
    : [];
  const showGraphEntry = topic === "master_patterns" || viewMode === "patterns";

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
            selectedPatternId={effectivePatternId}
            patternItems={patterns}
            algorithmIds={relatedTopicIds}
            edges={graphEdges}
            onPatternSelect={(variantId) => {
              setGraphPatternId(variantId);
              onVariantSelect(variantId);
              onVariantRunRequested?.();
            }}
            onAlgorithmSelect={onRelatedTopicSelect}
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
