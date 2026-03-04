import { useEffect, useMemo, useState } from "react";
import { runTutorRaw } from "../../api/coreClient";

const WISO_REQUEST = {
  version: "1.0",
  request_id: "wiso-bundle-de-v1",
  topic: "wiso",
  mode: "trace",
  lang: "de" as const,
  params: { section: "bundle", seed: 20260301, n_questions: 10 },
};

type TabId = "wissensbasis" | "trainingsfragen" | "pruefung";

type ExplainDeDefinition = {
  begriff?: string;
  definition?: string;
};

type ExplainDeStructured = {
  ueberblick?: string;
  kernpunkte?: string[];
  definitionen?: ExplainDeDefinition[];
  rechtsgrundlagen?: string[];
  pruefungsfokus?: string[];
  merkzusammenfassung?: string;
};

type WisoKnowledgeItem = {
  topic?: string;
  explain_de?: string | ExplainDeStructured;
  explain_fa?: string;
  typische_pruefungsfallen?: string[];
};

type WisoQuestion = {
  id?: string;
  frage?: string;
  optionen?: Record<string, string>;
  richtige_antwort?: string;
  erklaerung_de?: string;
};

type WisoTrainingTopic = {
  topic?: string;
  fragen?: WisoQuestion[];
};

type SimulationFrame = {
  exam_name?: string;
  anzahl_fragen?: number;
  punkte_gesamt?: number;
  zeit_minuten?: number;
};

type SimulationQuestion = {
  id?: string;
  frage?: string;
  optionen?: Record<string, string>;
};

type SimulationAnswer = {
  id?: string;
  antwort?: string;
};

type SimulationSolution = {
  id?: string;
  erklaerung_de?: string;
  erklaerung_fa?: string;
  fehleranalyse?: string[];
};

type WisoSimulation = {
  rahmen?: SimulationFrame;
  fragen?: SimulationQuestion[];
  answer_key?: SimulationAnswer[];
  solution_explanations?: SimulationSolution[];
};

type WisoSections = {
  wissensbasis?: WisoKnowledgeItem[];
  trainingsfragen?: WisoTrainingTopic[];
  pruefungssimulation?: WisoSimulation;
};

type WisoPayload = {
  doc_title?: string;
  sections?: WisoSections;
  error?: string;
};

type NormalizedKnowledge = {
  topic: string;
  overview: string;
  keyPoints: string[];
  definitions: ExplainDeDefinition[];
  legalRefs: string[];
  examFocus: string[];
  memorySummary: string;
  traps: string[];
  explainFa: string;
};

const FA_FALLBACK_BY_TOPIC: Record<string, string> = {
  "Rechte und Pflichten aus dem Ausbildungsvertrag":
    "هدف اصلی قرارداد کارآموزی، یادگیری حرفه‌ای است نه صرفاً انجام کار روزمره. کارفرما باید آموزش ساختارمند، ابزار لازم و فرصت حضور در Berufsschule و آزمون را فراهم کند. کارآموز هم باید فعالانه یاد بگیرد، Berichtsheft را کامل نگه دارد و مقررات کارگاه را رعایت کند.",
  "Kündigung (ordentlich/außerordentlich)":
    "در اخراج عادی باید مهلت قانونی رعایت شود و در اخراج فوری فقط با دلیل مهم می‌توان قرارداد را فوراً پایان داد. نکته مهم امتحانی: اخراج باید کتبی و امضاشده باشد؛ ایمیل و پیام‌رسان کافی نیست.",
  "Betriebsrat & Mitbestimmung":
    "شورای کار نماینده کارکنان در سطح شرکت است و به‌ویژه در موضوعات اجتماعی شرکت نقش مهم دارد. در آزمون باید تفاوت نقش شورای کار و اتحادیه را دقیق بیان کنید.",
  Tarifvertrag:
    "قرارداد جمعی شرایط اصلی کار مانند حقوق و ساعات کار را بین اتحادیه و طرف کارفرمایی تنظیم می‌کند و در شرایط مشخص الزام‌آور است.",
};

function repairMojibake(value: string): string {
  const input = value ?? "";
  const needsRepair = /[ÃÂØÙâ]/.test(input) || /[\u0080-\u009F]/.test(input);
  if (!needsRepair) return input;
  try {
    const bytes = new Uint8Array(Array.from(input, (ch) => ch.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    return decoded || input;
  } catch {
    return input;
  }
}

function stripControls(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "");
}

function normalizeDisplayText(value: string): string {
  return stripControls(repairMojibake(value)).trim();
}

function hasPersianChars(value: string): boolean {
  return /[\u0600-\u06FF]/.test(value);
}

function resolvePersianText(topic: string, raw: string): string {
  const normalized = normalizeDisplayText(raw);
  if (normalized.length > 0 && hasPersianChars(normalized)) return normalized;
  return FA_FALLBACK_BY_TOPIC[topic] || normalized;
}

function extractPayload(parsed: unknown): WisoPayload {
  if (!parsed || typeof parsed !== "object") return {};
  const root = parsed as { result?: unknown };
  if (!root.result || typeof root.result !== "object") return {};

  const direct = root.result as WisoPayload & { result?: unknown };
  if (direct.sections || direct.error) return direct;

  if (direct.result && typeof direct.result === "object") {
    return direct.result as WisoPayload;
  }
  return {};
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim());
}

function normalizeKnowledge(item: WisoKnowledgeItem): NormalizedKnowledge {
  const explainDe = item.explain_de;
  const base: NormalizedKnowledge = {
    topic: normalizeDisplayText(item.topic || "Topic"),
    overview: "",
    keyPoints: [],
    definitions: [],
    legalRefs: [],
    examFocus: [],
    memorySummary: "",
    traps: asStringList(item.typische_pruefungsfallen).map(normalizeDisplayText),
    explainFa: typeof item.explain_fa === "string" ? resolvePersianText(normalizeDisplayText(item.topic || "Topic"), item.explain_fa) : "",
  };

  if (typeof explainDe === "string") {
    base.overview = normalizeDisplayText(explainDe);
    return base;
  }

  if (!explainDe || typeof explainDe !== "object") {
    return base;
  }

  const structured = explainDe as ExplainDeStructured;
  base.overview = typeof structured.ueberblick === "string" ? normalizeDisplayText(structured.ueberblick) : "";
  base.keyPoints = asStringList(structured.kernpunkte).map(normalizeDisplayText);
  base.legalRefs = asStringList(structured.rechtsgrundlagen).map(normalizeDisplayText);
  base.examFocus = asStringList(structured.pruefungsfokus).map(normalizeDisplayText);
  base.memorySummary = typeof structured.merkzusammenfassung === "string" ? normalizeDisplayText(structured.merkzusammenfassung) : "";

  if (Array.isArray(structured.definitionen)) {
    base.definitions = structured.definitionen
      .filter((d): d is ExplainDeDefinition => !!d && typeof d === "object")
      .map((d) => ({
        begriff: typeof d.begriff === "string" ? normalizeDisplayText(d.begriff) : "",
        definition: typeof d.definition === "string" ? normalizeDisplayText(d.definition) : "",
      }))
      .filter((d) => d.begriff || d.definition);
  }

  return base;
}

export function WisoPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState("WISO (AP2)");
  const [sections, setSections] = useState<WisoSections>({});
  const [tab, setTab] = useState<TabId>("wissensbasis");

  const wissensbasis = useMemo(() => sections.wissensbasis ?? [], [sections.wissensbasis]);
  const trainingsfragen = useMemo(() => sections.trainingsfragen ?? [], [sections.trainingsfragen]);
  const pruefung = sections.pruefungssimulation;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const raw = await runTutorRaw(WISO_REQUEST);
        const parsed = JSON.parse(raw) as unknown;
        const payload = extractPayload(parsed);
        if (payload.error) throw new Error(payload.error);
        setDocTitle(payload.doc_title || "WISO (AP2)");
        setSections(payload.sections || {});
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const renderWissensbasis = () => (
    <div style={styles.list}>
      {wissensbasis.map((item, idx) => {
        const kb = normalizeKnowledge(item);
        return (
          <div key={`${kb.topic}-${idx}`} style={styles.card}>
            <div style={styles.wbHeaderRow}>
              <h3 style={styles.cardTitle}>{kb.topic}</h3>
              <div style={styles.wbChipRow}>
                {kb.legalRefs.length > 0 && <span style={styles.wbChip}>Law: {kb.legalRefs.length}</span>}
                {kb.definitions.length > 0 && <span style={styles.wbChip}>Defs: {kb.definitions.length}</span>}
                {kb.traps.length > 0 && <span style={styles.wbChipWarning}>Traps: {kb.traps.length}</span>}
              </div>
            </div>

            {kb.overview && (
              <div style={styles.wbSection}>
                <div style={styles.subTitle}>Overview</div>
                <div style={styles.text}>{kb.overview}</div>
              </div>
            )}

            <div style={styles.wbGrid}>
              {kb.keyPoints.length > 0 && (
                <div style={styles.wbSection}>
                  <div style={styles.subTitle}>Kernpunkte</div>
                  <ul style={styles.ul}>
                    {kb.keyPoints.map((point, pIdx) => (
                      <li key={`${kb.topic}-kp-${pIdx}`}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              {kb.definitions.length > 0 && (
                <div style={styles.wbSection}>
                  <div style={styles.subTitle}>Definitionen</div>
                  <div style={styles.definitionList}>
                    {kb.definitions.map((d, dIdx) => (
                      <div key={`${kb.topic}-def-${dIdx}`} style={styles.definitionItem}>
                        <strong>{d.begriff || "Begriff"}</strong>
                        {d.definition ? <div style={styles.textMuted}>{d.definition}</div> : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {kb.legalRefs.length > 0 && (
                <div style={styles.wbSection}>
                  <div style={styles.subTitle}>Rechtsgrundlagen</div>
                  <ul style={styles.ul}>
                    {kb.legalRefs.map((law, lIdx) => (
                      <li key={`${kb.topic}-law-${lIdx}`}>{law}</li>
                    ))}
                  </ul>
                </div>
              )}

              {kb.examFocus.length > 0 && (
                <div style={styles.wbSection}>
                  <div style={styles.subTitle}>Pruefungsfokus</div>
                  <ul style={styles.ul}>
                    {kb.examFocus.map((focus, fIdx) => (
                      <li key={`${kb.topic}-focus-${fIdx}`}>{focus}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {kb.memorySummary && (
              <div style={styles.wbSummary}>
                <strong>Merksatz:</strong> {kb.memorySummary}
              </div>
            )}

            {kb.traps.length > 0 && (
              <div style={styles.trapPanel}>
                <div style={styles.subTitle}>Typische Pruefungsfallen</div>
                <ul style={styles.ul}>
                  {kb.traps.map((trap, tIdx) => (
                    <li key={`${kb.topic}-trap-${tIdx}`}>{trap}</li>
                  ))}
                </ul>
              </div>
            )}

            {kb.explainFa && (
              <div style={styles.faPanel}>
                <strong>توضیح فارسی</strong>
                <div style={styles.faText}>{kb.explainFa}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderTrainingsfragen = () => (
    <div style={styles.list}>
      {trainingsfragen.map((group, gIdx) => (
        <div key={`${group.topic || "group"}-${gIdx}`} style={styles.card}>
          <h3 style={styles.cardTitle}>{group.topic || "Thema"}</h3>
          {(group.fragen || []).map((frage, qIdx) => (
            <div key={`${frage.id || "q"}-${qIdx}`} style={styles.questionCard}>
              <div style={styles.questionTitle}>
                {frage.id ? `${normalizeDisplayText(frage.id)} - ` : ""}{normalizeDisplayText(frage.frage || "")}
              </div>
              {frage.optionen && (
                <ul style={styles.ul}>
                  {Object.entries(frage.optionen).map(([k, v]) => (
                    <li key={`${frage.id || "q"}-${k}`}><strong>{normalizeDisplayText(k)}:</strong> {normalizeDisplayText(v)}</li>
                  ))}
                </ul>
              )}
              {frage.richtige_antwort && (
                <div style={styles.answer}><strong>Richtige Antwort:</strong> {normalizeDisplayText(frage.richtige_antwort)}</div>
              )}
              {frage.erklaerung_de && <div style={styles.textMuted}>{normalizeDisplayText(frage.erklaerung_de)}</div>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  const renderPruefung = () => {
    const frame = pruefung?.rahmen;
    const fragen = pruefung?.fragen || [];
    const keyMap = new Map<string, string>((pruefung?.answer_key || []).map((a) => [a.id || "", a.antwort || ""]));
    const solMap = new Map<string, SimulationSolution>((pruefung?.solution_explanations || []).map((s) => [s.id || "", s]));

    return (
      <div style={styles.list}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Pruefungssimulation</h3>
          <div style={styles.text}>Name: {normalizeDisplayText(frame?.exam_name || "-")}</div>
          <div style={styles.text}>Fragen: {frame?.anzahl_fragen ?? 0} | Punkte: {frame?.punkte_gesamt ?? 0} | Zeit: {frame?.zeit_minuten ?? 0} Minuten</div>
        </div>
        {fragen.map((q, idx) => {
          const answer = keyMap.get(q.id || "") || "-";
          const solution = solMap.get(q.id || "");
          return (
            <div key={`${q.id || "sim"}-${idx}`} style={styles.card}>
              <div style={styles.questionTitle}>{normalizeDisplayText(q.id || "")} - {normalizeDisplayText(q.frage || "")}</div>
              {q.optionen && (
                <ul style={styles.ul}>
                  {Object.entries(q.optionen).map(([k, v]) => (
                    <li key={`${q.id || "sim"}-${k}`}><strong>{normalizeDisplayText(k)}:</strong> {normalizeDisplayText(v)}</li>
                  ))}
                </ul>
              )}
              <div style={styles.answer}><strong>Antwort:</strong> {normalizeDisplayText(answer)}</div>
              {solution?.erklaerung_de && <div style={styles.textMuted}>{normalizeDisplayText(solution.erklaerung_de)}</div>}
              {solution?.erklaerung_fa && (
                <div style={styles.faPanel}>
                  <strong>توضیح فارسی</strong>
                  <div style={styles.faText}>{resolvePersianText(normalizeDisplayText(q.id || ""), solution.erklaerung_fa)}</div>
                </div>
              )}
              {solution?.fehleranalyse && solution.fehleranalyse.length > 0 && (
                <div>
                  <div style={styles.subTitle}>Fehleranalyse</div>
                  <ul style={styles.ul}>
                    {solution.fehleranalyse.map((f, fIdx) => (
                      <li key={`${q.id || "sim"}-f-${fIdx}`}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>{docTitle}</h2>
        <button type="button" style={styles.secondaryBtn} onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>

      <div style={styles.modeRow}>
        <button type="button" style={{ ...styles.modeBtn, ...(tab === "wissensbasis" ? styles.modeBtnActive : {}) }} onClick={() => setTab("wissensbasis")}>
          Wissensbasis
        </button>
        <button type="button" style={{ ...styles.modeBtn, ...(tab === "trainingsfragen" ? styles.modeBtnActive : {}) }} onClick={() => setTab("trainingsfragen")}>
          Trainingsfragen
        </button>
        <button type="button" style={{ ...styles.modeBtn, ...(tab === "pruefung" ? styles.modeBtnActive : {}) }} onClick={() => setTab("pruefung")}>
          Pruefungssimulation
        </button>
      </div>

      {loading && <div style={styles.panel}>Loading WISO data...</div>}
      {error && !loading && <div style={styles.errorPanel}>Error: {error}</div>}
      {!loading && !error && tab === "wissensbasis" && renderWissensbasis()}
      {!loading && !error && tab === "trainingsfragen" && renderTrainingsfragen()}
      {!loading && !error && tab === "pruefung" && renderPruefung()}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#05070b",
    color: "#d7e0ee",
    padding: "1rem",
  },
  header: {
    display: "flex",
    alignItems: "center",
    marginBottom: "0.75rem",
  },
  title: {
    margin: 0,
    color: "#9ceab6",
  },
  panel: {
    border: "1px solid #233447",
    borderRadius: "8px",
    background: "#0c141f",
    padding: "0.9rem",
    marginBottom: "0.7rem",
  },
  text: {
    margin: "0 0 0.55rem 0",
    lineHeight: 1.5,
  },
  textMuted: {
    margin: 0,
    color: "#a6b5c9",
    lineHeight: 1.45,
    fontSize: "14px",
  },
  list: {
    display: "grid",
    gap: "0.7rem",
  },
  card: {
    border: "1px solid #24384d",
    borderRadius: "8px",
    background: "#0c141f",
    padding: "0.85rem",
    display: "grid",
    gap: "0.55rem",
  },
  cardTitle: {
    margin: 0,
    color: "#dbe6f7",
  },
  wbHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.6rem",
    flexWrap: "wrap" as const,
  },
  wbChipRow: {
    display: "flex",
    gap: "0.35rem",
    flexWrap: "wrap" as const,
  },
  wbChip: {
    padding: "0.12rem 0.42rem",
    borderRadius: "999px",
    background: "#1b2a3d",
    border: "1px solid #3b5c82",
    fontSize: "11px",
    color: "#cfe2fa",
  },
  wbChipWarning: {
    padding: "0.12rem 0.42rem",
    borderRadius: "999px",
    background: "#312010",
    border: "1px solid #8f7540",
    fontSize: "11px",
    color: "#ffdba0",
  },
  wbGrid: {
    display: "grid",
    gap: "0.55rem",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  },
  wbSection: {
    border: "1px solid #2d435a",
    borderRadius: "8px",
    background: "#0f1825",
    padding: "0.55rem",
  },
  wbSummary: {
    border: "1px solid #3f536a",
    background: "#162333",
    borderRadius: "6px",
    padding: "0.45rem 0.55rem",
  },
  definitionList: {
    display: "grid",
    gap: "0.4rem",
  },
  definitionItem: {
    border: "1px solid #385476",
    borderRadius: "6px",
    background: "#101d2d",
    padding: "0.45rem",
    display: "grid",
    gap: "0.2rem",
  },
  trapPanel: {
    border: "1px solid #8f7540",
    background: "#20170d",
    borderRadius: "6px",
    padding: "0.55rem",
  },
  subTitle: {
    fontSize: "13px",
    color: "#b9cae0",
    marginBottom: "0.2rem",
  },
  ul: {
    margin: "0.2rem 0 0 1.1rem",
    lineHeight: 1.5,
  },
  questionCard: {
    border: "1px solid #2a4056",
    borderRadius: "8px",
    background: "#0f1825",
    padding: "0.65rem",
    display: "grid",
    gap: "0.38rem",
  },
  questionTitle: {
    fontWeight: 700,
    lineHeight: 1.45,
  },
  answer: {
    border: "1px solid #315c3f",
    background: "#102016",
    borderRadius: "6px",
    padding: "0.4rem 0.55rem",
  },
  faPanel: {
    border: "1px solid #8f7540",
    background: "#2b2212",
    borderRadius: "6px",
    padding: "0.5rem",
    color: "#ffdba0",
    direction: "rtl" as const,
    textAlign: "right" as const,
  },
  faText: {
    marginTop: "0.35rem",
    lineHeight: 1.85,
    fontSize: "15px",
    fontFamily: "'Vazirmatn', 'IRANSansX', Tahoma, 'Segoe UI', sans-serif",
    whiteSpace: "pre-wrap" as const,
  },
  modeRow: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "0.7rem",
    flexWrap: "wrap" as const,
  },
  modeBtn: {
    padding: "0.45rem 0.8rem",
    borderRadius: "6px",
    border: "1px solid #2f3e51",
    background: "#111925",
    color: "#c8d3e3",
    cursor: "pointer" as const,
  },
  modeBtnActive: {
    borderColor: "#6fa5e5",
    background: "#17253a",
  },
  secondaryBtn: {
    padding: "0.45rem 0.85rem",
    borderRadius: "6px",
    border: "1px solid #3f536a",
    background: "#1a2230",
    color: "#d7e0ee",
    cursor: "pointer" as const,
  },
  errorPanel: {
    border: "1px solid #8d3d4a",
    borderRadius: "8px",
    background: "#2b1117",
    color: "#ffc5ce",
    padding: "0.9rem",
  },
};
