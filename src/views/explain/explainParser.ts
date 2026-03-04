/**
 * Parse explain text into structured sections
 */

export interface ExplainSection {
  type: "concept" | "steps" | "example" | "exam_tip" | "fallback";
  title: string;
  content: string;
  icon: string;
}

/**
 * Parse explain text into sections based on common markers
 */
export function parseExplainSections(explainText: string): ExplainSection[] {
  if (!explainText || typeof explainText !== "string") {
    return [];
  }

  const sections: ExplainSection[] = [];
  const lines = explainText.split("\n");
  let currentSection: ExplainSection | null = null;
  let buffer: string[] = [];

  const sectionMarkers = {
    concept: ["konzept:", "concept:", "مفهوم:", "grundlagen:", "basics:"],
    steps: ["schritte:", "steps:", "مراحل:", "ablauf:", "procedure:"],
    example: ["beispiel:", "example:", "مثال:", "demo:"],
    exam_tip: ["prüfungstipp:", "exam tip:", "نکته امتحان:", "tip:"],
  };

  const detectSectionType = (line: string): keyof typeof sectionMarkers | null => {
    const lower = line.toLowerCase().trim();
    for (const [type, markers] of Object.entries(sectionMarkers)) {
      if (markers.some(m => lower.startsWith(m))) {
        return type as keyof typeof sectionMarkers;
      }
    }
    return null;
  };

  const flushBuffer = () => {
    if (currentSection && buffer.length > 0) {
      currentSection.content = buffer.join("\n").trim();
      if (currentSection.content) {
        sections.push(currentSection);
      }
    }
    buffer = [];
  };

  for (const line of lines) {
    const sectionType = detectSectionType(line);
    
    if (sectionType) {
      flushBuffer();
      
      const icons = {
        concept: "💡",
        steps: "📋",
        example: "📝",
        exam_tip: "⭐",
      };
      
      const titles = {
        concept: line.trim(),
        steps: line.trim(),
        example: line.trim(),
        exam_tip: line.trim(),
      };

      currentSection = {
        type: sectionType,
        title: titles[sectionType],
        content: "",
        icon: icons[sectionType],
      };
    } else {
      buffer.push(line);
    }
  }

  flushBuffer();

  // If no sections detected, treat entire text as fallback
  if (sections.length === 0 && explainText.trim()) {
    sections.push({
      type: "fallback",
      title: "Explanation",
      content: explainText.trim(),
      icon: "📖",
    });
  }

  return sections;
}
