/**
 * Metadata bar with topic info and fullscreen toggle
 */

import React from "react";
import { TopicId, getTopicEntry } from "../../domain/topicRegistry";

interface ExplainMetaBarProps {
  topic: TopicId;
  lang: "de" | "fa" | "bi";
  isFullscreen: boolean;
  onFullscreenToggle: () => void;
}

export function ExplainMetaBar({
  topic,
  lang,
  isFullscreen,
  onFullscreenToggle,
}: ExplainMetaBarProps) {
  const topicEntry = getTopicEntry(topic);

  return (
    <div style={styles.container}>
      <div style={styles.topicInfo}>
        <span style={styles.topicLabel}>{topicEntry.label}</span>
        <span style={styles.separator}>•</span>
        <span style={styles.lang}>{lang.toUpperCase()}</span>
      </div>
      <button onClick={onFullscreenToggle} style={styles.fullscreenButton}>
        {isFullscreen ? "⛶ Exit" : "⛶ Focus"}
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 2rem",
    background: "#1a1a1a",
    borderBottom: "1px solid #333",
  },
  topicInfo: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    color: "#aaa",
    fontSize: "14px",
  },
  topicLabel: {
    color: "#00ff88",
    fontWeight: "bold" as const,
  },
  separator: {
    color: "#555",
  },
  lang: {
    color: "#888",
  },
  fullscreenButton: {
    padding: "6px 14px",
    fontSize: "13px",
    background: "#333",
    color: "#aaa",
    border: "1px solid #555",
    borderRadius: "6px",
    cursor: "pointer" as const,
    fontWeight: "bold" as const,
  },
};
