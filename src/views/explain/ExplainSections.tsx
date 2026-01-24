/**
 * Section cards for Explain Mode reader
 */

import React from "react";
import { ExplainSection } from "./explainParser";
import { getSectionStyle } from "./explainTheme";

interface ExplainSectionsProps {
  sections: ExplainSection[];
  lang: "de" | "fa" | "bi";
}

export function ExplainSections({ sections, lang }: ExplainSectionsProps) {
  const isRTL = lang === "fa";

  if (sections.length === 0) {
    return (
      <div style={styles.empty}>
        No explanation sections found. Click Run to load content.
      </div>
    );
  }

  return (
    <div style={{ direction: isRTL ? "rtl" : "ltr" }}>
      {sections.map((section, idx) => (
        <div key={idx} style={getSectionStyle(section.type)}>
          <div
            style={{
              ...styles.sectionTitle,
              textAlign: isRTL ? "right" : "left",
            }}
          >
            <span style={styles.icon}>{section.icon}</span>
            {section.title}
          </div>
          <div
            style={{
              ...styles.sectionContent,
              textAlign: isRTL ? "right" : "left",
            }}
          >
            {section.content}
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  empty: {
    textAlign: "center" as const,
    padding: "4rem",
    color: "#888",
    fontSize: "16px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "bold" as const,
    color: "#fff",
    marginBottom: "1rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  icon: {
    fontSize: "24px",
  },
  sectionContent: {
    fontSize: "16px",
    lineHeight: "1.8",
    color: "#e0e0e0",
    whiteSpace: "pre-wrap" as const,
  },
};
