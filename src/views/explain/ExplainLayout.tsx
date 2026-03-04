/**
 * Layout wrapper for Explain Mode
 */

import React from "react";

interface ExplainLayoutProps {
  sidebar: React.ReactNode;
  metaBar: React.ReactNode;
  reader: React.ReactNode;
  isFullscreen: boolean;
}

export function ExplainLayout({
  sidebar,
  metaBar,
  reader,
  isFullscreen,
}: ExplainLayoutProps) {
  return (
    <div style={styles.container}>
      {!isFullscreen && <div style={styles.sidebar}>{sidebar}</div>}
      <div style={styles.main}>
        {metaBar}
        {reader}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
  },
  sidebar: {
    flexShrink: 0,
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
  },
};
