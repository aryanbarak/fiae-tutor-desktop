/**
 * Theme utilities for Explain Mode
 */

export const explainTheme = {
  reader: {
    maxWidth: "900px",
    padding: "2rem",
    lineHeight: "1.8",
    fontSize: "16px",
  },
  sidebar: {
    width: "300px",
    minWidth: "280px",
    maxWidth: "320px",
  },
  section: {
    marginBottom: "2rem",
    padding: "1.5rem",
    borderRadius: "12px",
  },
  colors: {
    concept: "#1a2a3a",
    steps: "#2a1a3a",
    example: "#1a3a2a",
    exam_tip: "#3a2a1a",
    fallback: "#2a2a2a",
  },
  borders: {
    concept: "#4a7aaa",
    steps: "#8a5aaa",
    example: "#5aaa7a",
    exam_tip: "#aa8a5a",
    fallback: "#666",
  },
};

export function getSectionStyle(type: string) {
  const base = {
    marginBottom: explainTheme.section.marginBottom,
    padding: explainTheme.section.padding,
    borderRadius: explainTheme.section.borderRadius,
    borderLeft: "4px solid",
  };

  return {
    ...base,
    background: (explainTheme.colors as any)[type] || explainTheme.colors.fallback,
    borderColor: (explainTheme.borders as any)[type] || explainTheme.borders.fallback,
  };
}
