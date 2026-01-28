/**
 * Main reader area for Explain Mode
 */


import { ResultRenderer } from "../../components/renderers";
import { ExplainError } from "./ExplainError";
import { explainTheme } from "./explainTheme";

interface ExplainReaderProps {
  response: any;
  error: string | null;
  status: "idle" | "running" | "success" | "error";
  lang: "de" | "fa" | "bi";
  onRetry?: () => void;
}

export function ExplainReader({
  response,
  error,
  status,
  lang,
  onRetry,
}: ExplainReaderProps) {
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
        <ResultRenderer 
          response={response} 
          lang={lang}
          availableVariants={[]}
          selectedVariantId={null}
          onVariantSelect={() => {}}
        />
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
