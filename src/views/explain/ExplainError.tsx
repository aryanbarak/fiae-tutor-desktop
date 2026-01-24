/**
 * Error display for Explain Mode
 */

import React from "react";

interface ExplainErrorProps {
  error: string;
  onRetry?: () => void;
}

export function ExplainError({ error, onRetry }: ExplainErrorProps) {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>⚠️</div>
        <div style={styles.title}>Error Loading Explanation</div>
        <pre style={styles.message}>{error}</pre>
        {onRetry && (
          <button onClick={onRetry} style={styles.retryButton}>
            🔄 Retry
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "2rem",
  },
  card: {
    background: "#3a1a1a",
    border: "2px solid #ff6666",
    borderRadius: "12px",
    padding: "2rem",
    textAlign: "center" as const,
  },
  icon: {
    fontSize: "48px",
    marginBottom: "1rem",
  },
  title: {
    fontSize: "20px",
    fontWeight: "bold" as const,
    color: "#ff6666",
    marginBottom: "1rem",
  },
  message: {
    color: "#ff9999",
    fontSize: "14px",
    whiteSpace: "pre-wrap" as const,
    textAlign: "left" as const,
    background: "#2a0a0a",
    padding: "1rem",
    borderRadius: "6px",
    marginBottom: "1rem",
  },
  retryButton: {
    padding: "10px 24px",
    fontSize: "16px",
    background: "#0066cc",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer" as const,
    fontWeight: "bold" as const,
  },
};
