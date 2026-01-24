/**
 * Main reader area for Explain Mode
 */

import React from "react";
import { ExplainSections } from "./ExplainSections";
import { ExplainError } from "./ExplainError";
import { parseExplainSections } from "./explainParser";
import { explainTheme } from "./explainTheme";

interface ExplainReaderProps {
  explainText: string | null;
  error: string | null;
  status: "idle" | "running" | "success" | "error";
  lang: "de" | "fa" | "bi";
  onRetry?: () => void;
}

export function ExplainReader({
  explainText,
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

  if (!explainText && status !== "running") {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}>📚</div>
        <div style={styles.emptyText}>
          Select a topic and click Run to view the explanation
        </div>
      </div>
    );
  }

  const sections = parseExplainSections(explainText || "");

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <ExplainSections sections={sections} lang={lang} />
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
