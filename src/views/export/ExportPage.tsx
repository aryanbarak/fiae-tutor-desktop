import { useEffect, useMemo, useState, type ReactNode } from "react";
import { runTutorRaw } from "../../api/coreClient";
import { getPreset } from "../../state/presets";
import "./ExportPrint.css";

type ExportLang = "de" | "fa" | "bi";

type ExportVariant = {
  id?: string;
  labels?: string[];
  pseudocode?: unknown;
  explain_variant?: unknown;
};

type ExportState =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "ready"; variants: ExportVariant[]; topicTitle: string; langLabel: string };

function parseBoolean(value: string | null, fallback: boolean): boolean {
  if (value === null || value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "y"].includes(normalized)) return true;
  if (["0", "false", "no", "n"].includes(normalized)) return false;
  return fallback;
}

function getVariantLabel(variant: ExportVariant, index: number): string {
  if (variant.labels && variant.labels.length > 0) {
    return variant.labels.join(" / ");
  }
  if (variant.id) {
    return variant.id;
  }
  return `Variant ${index + 1}`;
}

function normalizeText(value: unknown, lang: ExportLang): string {
  return normalizeTextWithOrder(value, [lang, "fa", "de", "bi"]);
}

function normalizeTextWithOrder(value: unknown, langOrder: ExportLang[]): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .map((entry) => normalizeTextWithOrder(entry, langOrder))
      .filter(Boolean)
      .join("\n");
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const preferred of langOrder) {
      const direct = record[preferred];
      if (typeof direct === "string") return direct;
    }
    const fa = record.fa;
    const de = record.de;
    if (typeof fa === "string" && typeof de === "string") {
      return `${fa}\n\n${de}`;
    }
    if (typeof fa === "string") return fa;
    if (typeof de === "string") return de;
    for (const key of Object.keys(record)) {
      const candidate = record[key];
      if (typeof candidate === "string") return candidate;
    }
  }
  return String(value);
}

function hasRtl(text: string): boolean {
  return /[\u0590-\u08FF]/.test(text);
}

function renderAutoDirection(text: string): ReactNode {
  if (hasRtl(text)) {
    return (
      <section dir="rtl" className="rtl">
        {renderMixedText(text, true)}
      </section>
    );
  }
  return text;
}

function renderMixedText(text: string, rtl: boolean): ReactNode[] {
  if (!rtl) return [text];
  const parts = text.split(/([A-Za-z0-9_./:+-]+)/g).filter((part) => part !== "");
  return parts.map((part, index) => {
    if (/^[A-Za-z0-9_./:+-]+$/.test(part)) {
      return (
        <bdi key={`bdi-${index}`} dir="ltr">
          {part}
        </bdi>
      );
    }
    return part;
  });
}

export function ExportPage() {
  const { topic, lang, includeExplain, includePseudocode } = useMemo(() => {
    const pathSegments = window.location.pathname.split("/").filter(Boolean);
    const exportIndex = pathSegments.indexOf("export");
    const topicSegment =
      exportIndex >= 0 ? pathSegments[exportIndex + 1] : pathSegments[1];
    const searchParams = new URLSearchParams(window.location.search);
    const rawLang = (searchParams.get("lang") || "de").toLowerCase();
    const resolvedLang: ExportLang =
      rawLang === "fa" || rawLang === "bi" ? rawLang : "de";
    return {
      topic: decodeURIComponent(topicSegment || ""),
      lang: resolvedLang,
      includeExplain: parseBoolean(
        searchParams.get("includeExplain"),
        true
      ),
      includePseudocode: parseBoolean(
        searchParams.get("includePseudocode"),
        true
      ),
    };
  }, []);

  const [state, setState] = useState<ExportState>({ status: "loading" });

  const isRtl = lang === "fa";
  const pseudocodeLangOrder: ExportLang[] = ["de", "fa", "bi"];

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      if (!topic) {
        setState({ status: "error", error: "Missing topic in URL." });
        return;
      }

      setState({ status: "loading" });

      try {
        const request = {
          version: "1.0",
          topic,
          mode: "pseudocode",
          lang,
          params: getPreset(topic, "pseudocode"),
        };

        const raw = await runTutorRaw(request);
        const trimmed = raw.trim();
        if (!trimmed) {
          throw new Error("Core returned empty output.");
        }

        const response = JSON.parse(trimmed);
        const rawVariants: ExportVariant[] = Array.isArray(response?.result?.variants)
          ? response.result.variants
          : response?.result?.pseudocode
          ? [
              {
                id: response?.result?.id ?? "variant",
                labels: response?.result?.labels ?? [],
                pseudocode: response.result.pseudocode,
                explain_variant: response.result.explain_variant,
              },
            ]
          : [];
        const variants = rawVariants.map((variant) => ({
          ...variant,
          labels: Array.isArray(variant.labels)
            ? variant.labels.map((label) => normalizeText(label, lang))
            : undefined,
        }));
        const topicTitle =
          response?.result?.title ||
          response?.result?.algorithm ||
          response?.result?.topic ||
          topic ||
          "Unknown Topic";
        const langLabel =
          response?.result?.lang && typeof response.result.lang === "string"
            ? response.result.lang
            : lang;

        if (!cancelled) {
          setState({ status: "ready", variants, topicTitle, langLabel });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (!cancelled) {
          setState({ status: "error", error: errorMsg });
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [topic, lang]);

  if (state.status === "loading") {
    return (
      <div className="export-root export-loading">
        <div className="export-status">Loading export preview...</div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="export-root export-error">
        <div className="export-status export-error-text">
          Export failed: {state.error}
        </div>
      </div>
    );
  }

  const variants = state.variants;

  return (
    <div className="export-root">
      <div className="export-toolbar no-print">
        <div className="export-toolbar-title">Export Preview</div>
        <div className="export-toolbar-actions">
          <button
            className="export-button"
            onClick={() => window.history.back()}
          >
            Back
          </button>
          <button
            className="export-button primary"
            onClick={() => window.print()}
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      <main className="export-content">
        <section className="export-cover">
          {isRtl ? (
            <section dir="rtl" className="rtl">
              <div className="export-cover-title">
                {renderMixedText(state.topicTitle, isRtl)}
              </div>
              <div className="export-cover-subtitle">
                {renderMixedText(`Language: ${state.langLabel}`, isRtl)}
              </div>
            </section>
          ) : (
            <>
              <div className="export-cover-title">
                {renderAutoDirection(state.topicTitle)}
              </div>
              <div className="export-cover-subtitle">
                {renderAutoDirection(`Language: ${state.langLabel}`)}
              </div>
            </>
          )}
        </section>

        <section className="export-toc page-break">
          {isRtl ? (
            <section dir="rtl" className="rtl">
              <h2 className="export-section-title">Table of Contents</h2>
              <ol className="export-toc-list">
                {variants.map((variant, index) => (
                  <li key={variant.id || index}>
                    {renderMixedText(getVariantLabel(variant, index), isRtl)}
                  </li>
                ))}
              </ol>
            </section>
          ) : (
            <>
              <h2 className="export-section-title">Table of Contents</h2>
              <ol className="export-toc-list">
                {variants.map((variant, index) => (
                  <li key={variant.id || index}>
                    {renderAutoDirection(getVariantLabel(variant, index))}
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>

        {variants.map((variant, index) => (
          <section className="export-variant page-break" key={variant.id || index}>
            {isRtl ? (
              <section dir="rtl" className="rtl">
                <h2 className="export-section-title">
                  {renderMixedText(getVariantLabel(variant, index), isRtl)}
                </h2>
                {includeExplain && Boolean(variant.explain_variant) && (
                  <div className="export-explain">
                    {renderMixedText(
                      normalizeText(variant.explain_variant, lang),
                      isRtl
                    )}
                  </div>
                )}
              </section>
            ) : (
              <>
                <h2 className="export-section-title">
                  {renderAutoDirection(getVariantLabel(variant, index))}
                </h2>
                {includeExplain && Boolean(variant.explain_variant) && (() => {
                  const explainText = normalizeText(variant.explain_variant, lang);
                  if (hasRtl(explainText)) {
                    return (
                      <section dir="rtl" className="rtl">
                        <div className="export-explain">
                          {renderMixedText(explainText, true)}
                        </div>
                      </section>
                    );
                  }
                  return <div className="export-explain">{explainText}</div>;
                })()}
              </>
            )}

            {includePseudocode && Boolean(variant.pseudocode) && (
              <pre className="export-pseudocode">
                {(() => {
                  const pseudocodeText = normalizeTextWithOrder(
                    variant.pseudocode,
                    pseudocodeLangOrder
                  );
                  return hasRtl(pseudocodeText)
                    ? renderMixedText(pseudocodeText, true)
                    : pseudocodeText;
                })()}
              </pre>
            )}
          </section>
        ))}
      </main>
    </div>
  );
}
