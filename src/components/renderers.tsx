/**
 * Output renderers for different response types
 */

import React from "react";
import { CoreResponse } from "../domain/types";
import { VariantInfo } from "../state/model";
import DirBlock from "./DirBlock";
import { ExamSessionState, ExamSessionItem, scoreAnswer } from "../utils/examSessionScoring";

/**
 * Debug UI flag - enables inspector panels for developers
 */
const DEBUG_UI = import.meta.env.VITE_DEBUG_UI === "true";

/**
 * Check if a language requires RTL (Right-to-Left) rendering
 */
function isRtlLang(lang: string): boolean {
  return lang === "fa" || lang === "ar" || lang === "he";
}

function blocksToText(blocks: any[]): string {
  if (!Array.isArray(blocks)) return "";
  const lines: string[] = [];
  for (const block of blocks) {
    if (!block || typeof block !== "object") continue;
    const type = block.type;
    const content = block.content;
    if (type === "list") {
      if (Array.isArray(content)) {
        for (const item of content) {
          lines.push(`- ${String(item)}`);
        }
      } else if (content !== undefined && content !== null) {
        lines.push(`- ${String(content)}`);
      }
      lines.push("");
    } else if (type === "code") {
      lines.push("```");
      lines.push(typeof content === "string" ? content : String(content ?? ""));
      lines.push("```");
      lines.push("");
    } else {
      if (content !== undefined && content !== null) {
        lines.push(typeof content === "string" ? content : String(content));
        lines.push("");
      }
    }
  }
  return lines.join("\n").trimEnd();
}

function renderBidiText(text: string, lang: string): React.ReactNode {
  if (!text) return text;
  if (lang !== "fa") return text;
  const parts = text.split(/([A-Za-z0-9_().+\-/*^=<>:]+)/);
  return (
    <>
      {parts.map((part, idx) =>
        idx % 2 === 1 ? (
          <bdi key={idx} dir="ltr" className="ltrToken">
            {part}
          </bdi>
        ) : (
          <span key={idx}>{part}</span>
        )
      )}
    </>
  );
}

const LTR_CHUNK = /([A-Za-z0-9_]+(?:[./:+\-*()=<>,'"\[\]]*[A-Za-z0-9_]+)*)/g;

function renderBidiInline(text: string): React.ReactNode {
  if (!text) return text;
  const parts = text.split(LTR_CHUNK);
  return (
    <>
      {parts.map((part, idx) =>
        /^[A-Za-z0-9_]+/.test(part) ? (
          <bdi key={idx} dir="ltr" className="bidi-ltr">
            {part}
          </bdi>
        ) : (
          <React.Fragment key={idx}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

function localizedText(value: any, lang: "de" | "fa" | "bi"): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const byLang = value[lang] ?? value.de ?? value.fa ?? value.text;
    if (typeof byLang === "string") return byLang;
  }
  if (value === null || value === undefined) return "";
  return String(value);
}

function variantTitle(v: any, lang: "de" | "fa" | "bi"): string {
  const title = localizedText(v?.title, lang);
  if (title.trim()) return title;
  const label = localizedText(v?.labels, lang);
  if (label.trim()) return label;
  if (typeof v?.id === "string" && v.id.trim()) return v.id;
  return "Variant";
}

type ExerciseType = "mcq" | "numeric" | "short_text" | "trace_steps" | "formula";

const EXERCISE_TYPES: Record<string, ExerciseType> = {
  ex04_complexity_classic: "numeric",
  ex05_complexity_early_exit: "numeric",
  ex04_complexity_best: "numeric",
  ex05_complexity_worst: "numeric",
  ex04_complexity_comparisons: "numeric",
  ex05_complexity_swaps: "numeric",
  ex04_complexity_log: "numeric",
  ex05_complexity_formula: "formula",
  ex04_complexity_comparisons_minmax: "numeric",
  ex01_trace_passes: "trace_steps",
  ex02_trace_after_i2: "trace_steps",
  ex03_trace_insert_pos: "trace_steps",
  ex01_trace_found: "trace_steps",
  ex02_trace_not_found: "trace_steps",
  ex03_trace_single: "trace_steps",
};

const MCQ_CHOICES: Record<string, { de: string[]; fa: string[] }> = {
  ex06_trap_mid_overflow: {
    de: [
      "Um Integer-Overflow zu vermeiden",
      "Weil (l+r)//2 schneller ist",
      "Weil es immer aufrundet",
      "Damit l und r unverÃ¤ndert bleiben",
    ],
    fa: [
      "Ø¨Ø±Ø§ÛŒ Ø¬Ù„ÙˆÚ¯ÛŒØ±ÛŒ Ø§Ø² overflow",
      "Ú†ÙˆÙ† (l+r)//2 Ø³Ø±ÛŒØ¹â€ŒØªØ± Ø§Ø³Øª",
      "Ú†ÙˆÙ† Ù‡Ù…ÛŒØ´Ù‡ Ø±Ùˆ Ø¨Ù‡ Ø¨Ø§Ù„Ø§ Ú¯Ø±Ø¯ Ù…ÛŒâ€ŒÚ©Ù†Ø¯",
      "Ø¨Ø±Ø§ÛŒ Ø§ÛŒÙ†Ú©Ù‡ l Ùˆ r ØªØºÛŒÛŒØ± Ù†Ú©Ù†Ù†Ø¯",
    ],
  },
};

function detectExerciseType(exId: string, task: string): ExerciseType {
  if (exId && EXERCISE_TYPES[exId]) return EXERCISE_TYPES[exId];
  const t = task.toLowerCase();
  if (t.includes("welche") && t.includes("bedingung")) return "short_text";
  if (t.includes("wie viele") || t.includes("anzahl") || t.includes("Ú†Ù†Ø¯") || t.includes("ØªØ¹Ø¯Ø§Ø¯")) return "numeric";
  if (t.includes("komplex") || t.includes("big-o") || t.includes("o(")) return "formula";
  if (t.includes("trace") || t.includes("zustand") || t.includes("nach i") || t.includes("Ø¨Ø¹Ø¯ Ø§Ø²")) return "trace_steps";
  return "short_text";
}


 

interface BaseRendererProps {
  response: CoreResponse;
  lang: "de" | "fa" | "bi";
}

interface ResultRendererProps extends BaseRendererProps {
  availableVariants: VariantInfo[];
  selectedVariantId: string | null;
  onVariantSelect: (variantId: string) => void;
}

/**
 * Render Result tab - shows pseudocode, explain text, or structured data
 * Now supports multi-variant display with stable state
 */
export function ResultRenderer({ 
  response, 
  lang, 
  availableVariants, 
  selectedVariantId, 
  onVariantSelect 
}: ResultRendererProps) {
  const [examIndex, setExamIndex] = React.useState(0);
  const [openSolutions, setOpenSolutions] = React.useState<Record<string, boolean>>({});
  const [examState, setExamState] = React.useState<Record<string, {
    answer: string;
    checked: boolean;
    isCorrect: boolean;
    attempts: number;
    revealed: boolean;
    hintUsed: boolean;
    warning?: string;
  }>>({});
  const [session, setSession] = React.useState<ExamSessionState | null>(null);
  const [mode, setMode] = React.useState<"learn" | "exam">("learn");
  const [timerEnabled, setTimerEnabled] = React.useState(false);
  const [remainingSec, setRemainingSec] = React.useState<number | null>(null);
  const [showSummary, setShowSummary] = React.useState(false);
  const [selectedPredictionTopic, setSelectedPredictionTopic] = React.useState<string | null>(null);
  const result = response?.result as any;
  const safeAvailableVariants: any[] = React.useMemo(
    () =>
      (Array.isArray(availableVariants) ? availableVariants : []).map((v, idx) => ({
        ...v,
        id: typeof v?.id === "string" && v.id.trim() ? v.id : `variant_${idx}`,
        title: variantTitle(v, lang),
      })),
    [availableVariants, lang]
  );

  React.useEffect(() => {
    setSelectedPredictionTopic(null);
  }, [
    result?.recommended_topic,
    Array.isArray(result?.predictions) ? result.predictions.length : 0,
  ]);

  if (!result) {
    return <div style={styles.empty}>No result data</div>;
  }

  if (result.exam_session) {
    const exam = result.exam_session || {};
    const isFa = lang === "fa";
    const normalizeExamSession = (raw: any) => {
      if (Array.isArray(raw?.exercises) && raw.exercises.length > 0) {
        const total =
          typeof raw.total === "number" && raw.total > 0
            ? raw.total
            : raw.exercises.length;
        return {
          topic: raw.topic || raw.meta?.topic || result.topic || "",
          total,
          exercises: raw.exercises,
        };
      }
      return {
        topic: raw.topic || raw.meta?.topic || result.topic || "",
        total: 1,
        exercises: [
          {
            id: raw.exercise_id || raw.meta?.exercise_id,
            task: raw.task,
            input: raw.input,
            expected: raw.expected,
            solution: raw.solution,
            traps: raw.traps,
            meta: raw.meta,
          },
        ],
      };
    };

    const normalized = normalizeExamSession(exam);
    const exercises = normalized.exercises || [];
    const total = normalized.total || exercises.length || 1;
    const safeIndex = Math.min(Math.max(examIndex, 0), Math.max(exercises.length - 1, 0));
    const current = exercises[safeIndex] || {};
    const exerciseKey = current.exercise_id || current.id || String(safeIndex);

    const taskValue = current.task;
    const task =
      typeof taskValue === "string"
        ? taskValue
        : taskValue?.[lang] || taskValue?.de || taskValue?.fa || "";
    const traps = Array.isArray(current.traps) ? current.traps : [];
    const displayTraps =
      DEBUG_UI && isFa
        ? [...traps, "Ù†Ù…ÙˆÙ†Ù‡: Ø´Ø±Ø· low <= high Ø±Ø§ Ø¨Ø±Ø±Ø³ÛŒ Ú©Ù†."]
        : traps;
    const solutionValue = current.solution;
    const solution =
      typeof solutionValue === "string"
        ? solutionValue
        : solutionValue?.[lang] || solutionValue?.de || solutionValue?.fa || "";
    const expectedValue = current.expected;
    const expected =
      typeof expectedValue === "string"
        ? expectedValue
        : expectedValue?.[lang] || expectedValue?.de || expectedValue?.fa || "";
    const hasSolution = solution.trim().length > 0;
    const hasExpected = expected.trim().length > 0;
    const toggleStyle = hasSolution
      ? styles.toggleButton
      : { ...styles.toggleButton, opacity: 0.5, cursor: "not-allowed" as const };
    const isMulti = exercises.length > 1;
    const isOpen = openSolutions[exerciseKey] ?? false;

    const sessionTopic = normalized.topic || exam.meta?.topic || result.topic || "";
    const sessionSeed = exam.meta?.seed ?? exam.seed ?? 1;
    const sessionKey = `${sessionTopic}::${sessionSeed}`;

    React.useEffect(() => {
      setExamIndex(0);
      setOpenSolutions({});
      setExamState({});
      setShowSummary(false);
      const sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      setSession({
        session_id: sessionId,
        started_at: new Date().toISOString(),
        items: [],
        totals: {
          points_total: 0,
          points_awarded: 0,
          correct_count: 0,
          total_time_sec: 0,
        },
      });
    }, [sessionKey]);

    const t = {
      answerLabel: isFa ? "Ù¾Ø§Ø³Ø®" : "Answer",
      answerPlaceholder: isFa ? "Ù¾Ø§Ø³Ø® Ø®ÙˆØ¯ Ø±Ø§ Ø¨Ù†ÙˆÛŒØ³ÛŒØ¯..." : "Type your answer...",
      checkAnswer: isFa ? "Ø¨Ø±Ø±Ø³ÛŒ Ù¾Ø§Ø³Ø®" : "Check Answer",
      noExpected: isFa
        ? "Ù¾Ø§Ø³Ø® Ø±Ø³Ù…ÛŒ Ù†Ø¯Ø§Ø±Ø¯Ø› Ø§Ø² Ø±Ø§Ù‡â€ŒØ­Ù„ Ø§Ø³ØªÙØ§Ø¯Ù‡ Ú©Ù†."
        : "No official expected answer; use solution as guidance.",
      correct: isFa ? "âœ… Ø¯Ø±Ø³Øª Ø§Ø³Øª." : "âœ… Correct.",
      wrong: isFa ? "âŒ Ù†Ø§Ø¯Ø±Ø³Øª Ø§Ø³Øª. Ù‚Ø§Ù„Ø¨ Ù¾Ø§Ø³Ø® Ø±Ø§ Ø¨Ø§ Expected Ù…Ù‚Ø§ÛŒØ³Ù‡ Ú©Ù†." : "âŒ Incorrect. Compare with expected format.",
      firstTry: isFa ? "Ø§ÙˆÙ„ Ø¬ÙˆØ§Ø¨ Ø¨Ø¯Ù‡." : "First try answering.",
      score: isFa ? "Ø§Ù…ØªÛŒØ§Ø²" : "Score",
      expectedLabel: isFa ? "Ù¾Ø§Ø³Ø® Ù…ÙˆØ±Ø¯ Ø§Ù†ØªØ¸Ø§Ø±" : "Expected",
      typeLabel: isFa ? "Ù†ÙˆØ¹ Ø³ÙˆØ§Ù„" : "Type",
      modeLabel: isFa ? "Ø­Ø§Ù„Øª" : "Mode",
      learn: isFa ? "Ø¢Ù…ÙˆØ²Ø´ÛŒ" : "Learn",
      exam: isFa ? "Ø§Ù…ØªØ­Ø§Ù†" : "Exam",
      timer: isFa ? "Ø²Ù…Ø§Ù†â€ŒØ³Ù†Ø¬" : "Timer",
      submit: isFa ? "Ø«Ø¨Øª Ù¾Ø§Ø³Ø®" : "Submit",
      hint: isFa ? "Ù†Ù…Ø§ÛŒØ´ Ø±Ø§Ù‡Ù†Ù…Ø§" : "Show hint",
      summary: isFa ? "Ø®Ù„Ø§ØµÙ‡ Ø¬Ù„Ø³Ù‡" : "Session Summary",
      export: isFa ? "Ø®Ø±ÙˆØ¬ÛŒ JSON Ø¬Ù„Ø³Ù‡" : "Export session JSON",
      timeLeft: isFa ? "Ø²Ù…Ø§Ù† Ø¨Ø§Ù‚ÛŒâ€ŒÙ…Ø§Ù†Ø¯Ù‡" : "Time left",
    };

    const stateKey = `${sessionKey}::${safeIndex}`;
    const currentState = examState[stateKey] || {
      answer: "",
      checked: false,
      isCorrect: false,
      attempts: 0,
      revealed: false,
      hintUsed: false,
      warning: "",
    };

    const answeredCount = Object.values(examState).filter((s) => s.checked).length;
    const correctCount = Object.values(examState).filter((s) => s.isCorrect).length;

    const exerciseType = detectExerciseType(current.id || exerciseKey, task || "");
    const mcqChoices = MCQ_CHOICES[current.id || ""]?.[isFa ? "fa" : "de"];
    const exerciseId = current.id || exerciseKey;
    const durationMap: Record<string, number> = {
      ex01_trace_passes: 120,
      ex02_trace_after_i2: 90,
      ex03_trace_insert_pos: 90,
      ex04_complexity_best: 60,
      ex05_complexity_worst: 60,
    };
    const defaultDuration = 90;
    const exerciseDuration = durationMap[exerciseId] ?? defaultDuration;

    React.useEffect(() => {
      if (!timerEnabled) {
        setRemainingSec(null);
        return;
      }
      setRemainingSec(exerciseDuration);
    }, [timerEnabled, exerciseId]);

    React.useEffect(() => {
      if (!timerEnabled || remainingSec === null) return;
      if (remainingSec <= 0) {
        handleSubmit(true);
        return;
      }
      const id = setInterval(() => {
        setRemainingSec((s) => (s === null ? null : s - 1));
      }, 1000);
      return () => clearInterval(id);
    }, [timerEnabled, remainingSec]);

    function handleSubmit(auto = false) {
      const trimmedAnswer = currentState.answer.trim();
      const trimmedExpected = expected.trim();
      if (!trimmedExpected) {
        setExamState((prev) => ({
          ...prev,
          [stateKey]: {
            ...currentState,
            checked: true,
            attempts: currentState.attempts + 1,
            warning: t.noExpected,
          },
        }));
        return;
      }
      const { is_correct, points_awarded } = scoreAnswer(
        trimmedExpected,
        trimmedAnswer,
        currentState.revealed
      );
      setExamState((prev) => ({
        ...prev,
        [stateKey]: {
          ...currentState,
          checked: true,
          isCorrect: is_correct,
          attempts: currentState.attempts + 1,
          warning: "",
        },
      }));
      if (session) {
        const timeSpent = timerEnabled ? (exerciseDuration - (remainingSec ?? exerciseDuration)) : 0;
        const item: ExamSessionItem = {
          exercise_id: exerciseId,
          task: task || "",
          input: current.input ?? {},
          answer: trimmedAnswer,
          is_correct,
          attempts: currentState.attempts + 1,
          time_spent_sec: timeSpent,
          revealed_solution: currentState.revealed,
          points_awarded,
          hint_used: currentState.revealed,
        };
        const items = session.items.filter((i) => i.exercise_id !== exerciseId).concat(item);
        const totals = {
          points_total: total,
          points_awarded: items.reduce((s, i) => s + i.points_awarded, 0),
          correct_count: items.filter((i) => i.is_correct).length,
          total_time_sec: items.reduce((s, i) => s + i.time_spent_sec, 0),
        };
        setSession({ ...session, items, totals });
      }
      if (auto && mode === "exam") {
        setExamIndex((prev) => Math.min(exercises.length - 1, prev + 1));
      }
    }

    return (
      <div dir={isFa ? "rtl" : "ltr"} className={isFa ? "rtl" : undefined}>
        <div style={styles.header}>
          Exam Session {normalized.topic ? `- ${normalized.topic}` : ""}
        </div>
        {isMulti && (
          <div style={styles.examSection}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                onClick={() => setExamIndex((prev) => Math.max(0, prev - 1))}
                disabled={safeIndex === 0}
                style={styles.navButton}
              >
                Prev
              </button>
              <button
                onClick={() => setExamIndex((prev) => Math.min(exercises.length - 1, prev + 1))}
                disabled={safeIndex >= exercises.length - 1}
                style={styles.navButton}
              >
                Next
              </button>
              <div style={styles.examLabel}>
                Exercise {safeIndex + 1} / {total}
              </div>
              <div style={{ ...styles.examLabel, marginLeft: "8px" }}>
                {t.typeLabel}: {exerciseType}
              </div>
              <div style={{ ...styles.examLabel, marginLeft: "8px" }}>
                {t.score}: {correctCount} / {answeredCount}
              </div>
              <div style={{ ...styles.examLabel, marginLeft: "8px" }}>
                {t.modeLabel}: {mode === "exam" ? t.exam : t.learn}
              </div>
              <div style={{ display: "flex", gap: "6px", marginLeft: "8px" }}>
                <button
                  onClick={() => setMode("learn")}
                  style={mode === "learn" ? styles.toggleButton : styles.navButton}
                >
                  {t.learn}
                </button>
                <button
                  onClick={() => setMode("exam")}
                  style={mode === "exam" ? styles.toggleButton : styles.navButton}
                >
                  {t.exam}
                </button>
              </div>
              <label style={{ marginLeft: "8px", display: "flex", gap: "6px", alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={timerEnabled}
                  onChange={(e) => setTimerEnabled(e.target.checked)}
                />
                {t.timer}
              </label>
              {timerEnabled && remainingSec !== null && (
                <div style={{ ...styles.examLabel, marginLeft: "8px" }}>
                  {t.timeLeft}: {remainingSec}s
                </div>
              )}
            </div>
          </div>
        )}
        <div style={styles.examSection}>
          <div style={styles.examLabel}>Task</div>
          <DirBlock
            rtl={isFa}
            style={{
              ...styles.examText,
              unicodeBidi: "plaintext",
            }}
          >
            {isFa ? renderBidiInline(task) : task}
          </DirBlock>
        </div>

        <div style={styles.examSection}>
          <div style={styles.examLabel}>Input</div>
          <DirBlock rtl={false}>
            <pre style={styles.jsonBlock}>
              {JSON.stringify(current.input ?? {}, null, 2)}
            </pre>
          </DirBlock>
        </div>

        <div style={styles.examSection}>
          <div style={styles.examLabel}>{t.answerLabel}</div>
          {exerciseType === "mcq" && mcqChoices ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {mcqChoices.map((choice) => (
                <label key={choice} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="radio"
                    name={`mcq-${stateKey}`}
                    checked={currentState.answer === choice}
                    disabled={mode === "exam" && currentState.checked}
                    onChange={() =>
                      setExamState((prev) => ({
                        ...prev,
                        [stateKey]: { ...currentState, answer: choice, warning: "" },
                      }))
                    }
                  />
                  <span>{choice}</span>
                </label>
              ))}
            </div>
          ) : exerciseType === "numeric" ? (
            <input
              type="number"
              style={styles.answerInput}
              placeholder={t.answerPlaceholder}
              value={currentState.answer}
              disabled={mode === "exam" && currentState.checked}
              onChange={(e) =>
                setExamState((prev) => ({
                  ...prev,
                  [stateKey]: { ...currentState, answer: e.target.value, warning: "" },
                }))
              }
            />
          ) : exerciseType === "formula" ? (
            <input
              type="text"
              style={styles.answerInput}
              placeholder={t.answerPlaceholder}
              value={currentState.answer}
              disabled={mode === "exam" && currentState.checked}
              onChange={(e) =>
                setExamState((prev) => ({
                  ...prev,
                  [stateKey]: { ...currentState, answer: e.target.value, warning: "" },
                }))
              }
            />
          ) : exerciseType === "short_text" ? (
            <input
              type="text"
              style={styles.answerInput}
              placeholder={t.answerPlaceholder}
              value={currentState.answer}
              disabled={mode === "exam" && currentState.checked}
              onChange={(e) =>
                setExamState((prev) => ({
                  ...prev,
                  [stateKey]: { ...currentState, answer: e.target.value, warning: "" },
                }))
              }
            />
          ) : (
            <textarea
              style={styles.answerInput}
              placeholder={t.answerPlaceholder}
              value={currentState.answer}
              disabled={mode === "exam" && currentState.checked}
              onChange={(e) =>
                setExamState((prev) => ({
                  ...prev,
                  [stateKey]: { ...currentState, answer: e.target.value, warning: "" },
                }))
              }
            />
          )}
          <div style={{ marginTop: "8px", display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={() => handleSubmit(false)}
              style={styles.toggleButton}
            >
              {mode === "exam" ? t.submit : t.checkAnswer}
            </button>
            {currentState.warning && (
              <div style={{ color: "#ffcc66" }}>{currentState.warning}</div>
            )}
          </div>
          {currentState.checked && expected.trim() && (
            <div style={{ marginTop: "8px", color: currentState.isCorrect ? "#88ff88" : "#ff8888" }}>
              {currentState.isCorrect ? t.correct : t.wrong}
            </div>
          )}
          {(currentState.checked && !currentState.isCorrect && expected.trim()) ||
          (currentState.revealed && expected.trim()) ? (
            <div style={{ marginTop: "8px" }}>
              <div style={styles.examLabel}>{t.expectedLabel}</div>
              <DirBlock
                rtl={isFa}
                style={styles.examSolution}
              >
                {expected}
              </DirBlock>
            </div>
          ) : null}
        </div>

        {displayTraps.length > 0 && (
          <div
            style={styles.examSection}
            className={isFa ? "traps rtl" : "traps"}
            dir={isFa ? "rtl" : "ltr"}
          >
            <div style={styles.examLabel}>Traps</div>
            {mode === "exam" ? (
              <>
                <button
                  onClick={() =>
                    setExamState((prev) => ({
                      ...prev,
                      [stateKey]: {
                        ...currentState,
                        hintUsed: true,
                      },
                    }))
                  }
                  style={styles.toggleButton}
                >
                  {t.hint}
                </button>
                {currentState.hintUsed && (
                  <ul style={styles.examList}>
                    {displayTraps.map((trap: string, idx: number) => (
                      <li key={idx} style={styles.examListItem}>
                        <DirBlock rtl={isFa}>
                          {trap}
                        </DirBlock>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <ul style={styles.examList}>
                {displayTraps.map((trap: string, idx: number) => (
                  <li key={idx} style={styles.examListItem}>
                    <DirBlock rtl={isFa}>
                      {trap}
                    </DirBlock>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div style={styles.examSection}>
          <button
            onClick={() =>
              setOpenSolutions((prev) => {
                if (mode === "exam" && !currentState.checked) {
                  setExamState((s) => ({
                    ...s,
                    [stateKey]: { ...currentState, warning: t.firstTry },
                  }));
                  return prev;
                }
                if (currentState.attempts < 1) {
                  setExamState((s) => ({
                    ...s,
                    [stateKey]: { ...currentState, warning: t.firstTry },
                  }));
                  return prev;
                }
                setExamState((s) => ({
                  ...s,
                  [stateKey]: { ...currentState, revealed: !isOpen, warning: "" },
                }));
                return { ...prev, [exerciseKey]: !isOpen };
              })
            }
            style={toggleStyle}
            disabled={!hasSolution || (mode === "exam" && !currentState.checked)}
          >
            {isOpen ? "Hide solution" : "Show solution"}
          </button>
          {!hasSolution && hasExpected && (
            <DirBlock
              rtl={isFa}
              style={styles.examSolution}
            >
              {expected}
            </DirBlock>
          )}
          {!hasSolution && !hasExpected && (
            <div style={styles.examSolution}>
              No solution available for this exercise.
            </div>
          )}
          {isOpen && hasSolution && (
            <DirBlock
              rtl={isFa}
              style={styles.examSolution}
            >
              {solution}
            </DirBlock>
          )}
        </div>

        <div style={styles.examSection}>
          <button onClick={() => setShowSummary(!showSummary)} style={styles.toggleButton}>
            {t.summary}
          </button>
          {showSummary && session && (
            <div style={{ marginTop: "12px" }}>
              <div style={{ marginBottom: "8px" }}>
                <div style={styles.examLabel}>
                  {t.score}: {session.totals.correct_count} / {total}
                </div>
                <div style={styles.examLabel}>
                  Points: {session.totals.points_awarded} / {session.totals.points_total}
                </div>
                <div style={styles.examLabel}>
                  Time: {session.totals.total_time_sec}s
                </div>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "8px" }}>
                <thead>
                  <tr>
                    <th style={styles.examTableHeader}>#</th>
                    <th style={styles.examTableHeader}>ID</th>
                    <th style={styles.examTableHeader}>Correct</th>
                    <th style={styles.examTableHeader}>Attempts</th>
                    <th style={styles.examTableHeader}>Time(s)</th>
                    <th style={styles.examTableHeader}>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {session.items.map((item, idx) => (
                    <tr key={item.exercise_id}>
                      <td style={styles.examTableCell}>{idx + 1}</td>
                      <td style={styles.examTableCell}>{item.exercise_id}</td>
                      <td style={styles.examTableCell}>{item.is_correct ? "âœ…" : "âŒ"}</td>
                      <td style={styles.examTableCell}>{item.attempts}</td>
                      <td style={styles.examTableCell}>{item.time_spent_sec}</td>
                      <td style={styles.examTableCell}>{item.points_awarded}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <pre style={styles.jsonBlock}>{JSON.stringify(session, null, 2)}</pre>
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(session, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `exam_session_${session.session_id}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                style={styles.copyButton}
              >
                {t.export}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Use variants from model state (stable) instead of response
  const hasVariants = safeAvailableVariants.length > 0;

  // Variant Selector Component (reusable)
  const VariantSelector = () => {
    if (!hasVariants) return null;

    const selectedVariant = selectedVariantId
      ? safeAvailableVariants.find((v) => v.id === selectedVariantId) || safeAvailableVariants[0]
      : safeAvailableVariants[0];

    return (
      <div style={styles.variantSelector}>
        <span style={styles.variantLabel}>Variants ({safeAvailableVariants.length}):</span>
        <select
          value={selectedVariant?.id || safeAvailableVariants[0]?.id}
          onChange={(e) => onVariantSelect(e.target.value)}
          style={styles.variantDropdown}
        >
          {safeAvailableVariants.map((v) => (
            <option key={v.id} value={v.id}>
              {String(v.title || v.id)}
            </option>
          ))}
        </select>
      </div>
    );
  };

  if (hasVariants) {
    const selectedVariant = selectedVariantId
      ? safeAvailableVariants.find((v) => v.id === selectedVariantId) || safeAvailableVariants[0]
      : safeAvailableVariants[0];

    if (selectedVariant.pseudocode) {
      const pseudocodeText = localizedText(selectedVariant.pseudocode, lang);
      const persianExplanation = localizedText(
        selectedVariant.explain_variant?.fa ?? selectedVariant.explain_variant,
        "fa"
      );

      return (
        <div>
          <VariantSelector />
          <div style={styles.header}>
            {result.topic || "Algorithm"} - {variantTitle(selectedVariant, lang)}
          </div>

          <pre style={styles.codeBlock}>{pseudocodeText}</pre>
          <button
            onClick={() => navigator.clipboard.writeText(pseudocodeText)}
            style={styles.copyButton}
          >
            Copy Code
          </button>

          {persianExplanation && (
            <div
              style={{
                ...styles.variantExplain,
                direction: "rtl",
                textAlign: "right",
                unicodeBidi: "plaintext",
              }}
            >
              <div style={styles.variantExplainLabel}>توضیح فارسی این Variant</div>
              <div style={styles.variantExplainText} className="rtlText">
                {renderBidiText(persianExplanation, "fa")}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (selectedVariant.explain) {
      const isRTL = lang === "fa";
      const explainText = localizedText(selectedVariant.explain, lang);
      const goalText = localizedText(selectedVariant.goal, lang);
      const notesText = localizedText(selectedVariant.notes, lang);
      return (
        <div>
          <VariantSelector />
          <div style={styles.header}>{variantTitle(selectedVariant, lang)}</div>
          <div
            style={{
              ...styles.explainText,
              direction: isRTL ? "rtl" : "ltr",
              textAlign: isRTL ? "right" : "left",
              unicodeBidi: "plaintext",
            }}
            className={isRTL ? "rtlText" : undefined}
          >
            {renderBidiText(explainText, lang)}
          </div>

          {goalText && (
            <div style={{ marginTop: "1rem" }}>
              <strong>{isRTL ? "هدف" : "Ziel"}:</strong> {goalText}
            </div>
          )}

          {notesText && (
            <div style={{ marginTop: "0.5rem", fontStyle: "italic" }}>
              <strong>{isRTL ? "نکته" : "Hinweis"}:</strong> {notesText}
            </div>
          )}

          {selectedVariant.exercises && selectedVariant.exercises.length > 0 && (
            <div style={{ marginTop: "1.5rem" }}>
              <strong>{isRTL ? "تمرینات" : "Übungen"}:</strong>
              {selectedVariant.exercises.map((ex: any, idx: number) => (
                <div key={idx} style={styles.exerciseCard}>
                  <div style={styles.exerciseTitle}>{localizedText(ex.title, lang) || ex.id}</div>
                  <div style={styles.exerciseTask}>
                    <strong>{isRTL ? "سؤال:" : "Aufgabe:"}</strong> {localizedText(ex.task, lang)}
                  </div>
                  {ex.solution && (
                    <details style={{ marginTop: "0.5rem" }}>
                      <summary style={{ cursor: "pointer", color: "#4CAF50" }}>
                        {isRTL ? "نمایش جواب" : "Lösung anzeigen"}
                      </summary>
                      <div
                        style={{
                          marginTop: "0.5rem",
                          padding: "0.5rem",
                          background: "#1a1a1a",
                          borderRadius: "4px",
                        }}
                      >
                        {localizedText(ex.solution, lang)}
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div>
        <VariantSelector />
        <div style={styles.empty}>Variant "{variantTitle(selectedVariant, lang)}" has no content</div>
      </div>
    );
  }

  // Check for error response from backend.
  // Distinguish explain-loader errors from algorithm/domain errors.
  if (result.error) {
    const looksLikeExplainLoadError =
      result.error === true ||
      typeof result.error_type === "string" ||
      typeof result.error_message === "string";

    if (looksLikeExplainLoadError) {
      return (
        <div>
          <div style={{...styles.header, backgroundColor: "#d32f2f"}}>
            Error Loading Explain Content
          </div>
          <div style={{
            padding: "1rem",
            backgroundColor: "#ffebee",
            color: "#c62828",
            borderRadius: "4px",
            marginTop: "1rem",
            fontFamily: "monospace",
            whiteSpace: "pre-wrap"
          }}>
            <strong>Error Type:</strong> {result.error_type || "unknown"}<br/>
            <strong>Message:</strong> {result.error_message || "Unknown error"}
          </div>
          <div style={{marginTop: "1rem", fontSize: "0.9rem", color: "#666"}}>
            <strong>Topic:</strong> {result.topic || "unknown"} | <strong>Language:</strong> {result.lang || "unknown"}
          </div>
        </div>
      );
    }

    const errorCode = String(result.error);
    const errorDetail =
      errorCode === "array_not_sorted"
        ? "Binary Search braucht ein sortiertes Array (aufsteigend oder absteigend), z. B. [1, 3, 5, 7, 9] oder [9, 7, 5, 3, 1]."
        : errorCode;

    return (
      <div>
        <div style={{...styles.header, backgroundColor: "#d32f2f"}}>
          Algorithm Error
        </div>
        <div style={{
          padding: "1rem",
          backgroundColor: "#ffebee",
          color: "#c62828",
          borderRadius: "4px",
          marginTop: "1rem",
          fontFamily: "monospace",
          whiteSpace: "pre-wrap"
        }}>
          <strong>Error:</strong> {errorDetail}
        </div>
      </div>
    );
  }

  // STRICT: Explain Core v1.0 - structured sections rendering (FROZEN SCHEMA)
  // Only render sections that exist in sections array
  // No fallbacks, no normalization, no heuristics
  if (result.sections && Array.isArray(result.sections)) {
    const isRtl = isRtlLang(lang);
    
    // Validate we have sections to render
    if (result.sections.length === 0) {
      return (
        <div>
          <div style={styles.header}>ðŸ’¡ {result.title || "Explanation"}</div>
          <div style={{...styles.empty, color: "#ff9800"}}>
            âš ï¸ No sections found in explain content. The sections array is empty.
          </div>
        </div>
      );
    }
    
    return (
      <div>
        <div style={styles.header}>ðŸ’¡ {result.title || "Explanation"}</div>
        <div style={styles.sectionsContainer}>
          {result.sections.map((section: any, idx: number) => {
            // STRICT: Use only validated schema fields
            const sectionId = section.id || `section-${idx}`;
            const sectionTitle = localizedText(section.title, lang) || "Untitled Section";
            const sectionBodyRaw =
              section.body ??
              (Array.isArray(section.blocks) ? blocksToText(section.blocks) : "");
            const sectionBody = localizedText(sectionBodyRaw, lang);
            const sectionFormat = section.format || "md";
            const sectionRtl = section.rtl ?? isRtl;
            
            // Warn if body is empty (schema should prevent this, but defensive)
            if (!sectionBody.trim()) {
              console.warn(`[ExplainRenderer] Section ${sectionId} has empty body!`);
              return (
                <div key={sectionId} style={{...styles.section, borderLeft: "3px solid #ff9800"}}>
                  <h3 style={{
                    ...styles.sectionTitle,
                    direction: sectionRtl ? "rtl" : "ltr",
                    textAlign: sectionRtl ? "right" : "left",
                  }}>
                    {sectionTitle}
                  </h3>
                  <div style={{color: "#ff9800", fontStyle: "italic"}}>
                    âš ï¸ Section body is empty
                  </div>
                </div>
              );
            }
            
            return (
              <div key={sectionId} style={styles.section}>
                <h3 style={{
                  ...styles.sectionTitle,
                  direction: sectionRtl ? "rtl" : "ltr",
                  textAlign: sectionRtl ? "right" : "left",
                }}>
                  {sectionTitle}
                </h3>
                <div style={{
                  ...styles.sectionBody,
                  direction: sectionRtl ? "rtl" : "ltr",
                  textAlign: sectionRtl ? "right" : "left",
                  unicodeBidi: "plaintext",
                  whiteSpace: sectionFormat === "text" ? "pre-wrap" : "pre-wrap",
                }} className={sectionRtl ? "rtlText" : undefined}>
                  {renderBidiText(sectionBody, lang)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Pattern detector / master_patterns format
  if (
    Object.prototype.hasOwnProperty.call(result, "predictions") &&
    Object.prototype.hasOwnProperty.call(result, "matched_keywords")
  ) {
    const isFa = lang === "fa";
    const templateKey =
      isFa ? "template_pseudocode_fa" : "template_pseudocode_de";
    const fallbackTemplateKey =
      isFa ? "template_pseudocode_de" : "template_pseudocode_fa";
    const templatePseudocode =
      (result?.[templateKey] as string) ||
      (result?.[fallbackTemplateKey] as string) ||
      "";
    const predictions = Array.isArray(result.predictions) ? result.predictions : [];
    const normalizedPredictions = predictions
      .filter((p: any) => p && typeof p === "object")
      .map((p: any) => ({
        topic: typeof p.topic === "string" ? p.topic : "unknown",
        score: typeof p.score === "number" ? p.score : 0,
        priority: typeof p.priority === "number" ? p.priority : 0,
        keywords: Array.isArray(p.keywords_found) ? p.keywords_found : [],
      }));
    const trapsKey = isFa ? "traps_fa" : "traps_de";
    const fallbackTrapsKey = isFa ? "traps_de" : "traps_fa";
    const traps =
      (Array.isArray(result?.[trapsKey]) ? result[trapsKey] : undefined) ||
      (Array.isArray(result?.[fallbackTrapsKey]) ? result[fallbackTrapsKey] : []);
    const trapsFa = Array.isArray(result?.traps_fa) ? result.traps_fa : [];
    const nextSteps = Array.isArray(result.next_steps) ? result.next_steps : [];
    const matchedKeywords =
      result.matched_keywords && typeof result.matched_keywords === "object"
        ? result.matched_keywords
        : {};
    const recommendedTopic =
      typeof result.recommended_topic === "string" && result.recommended_topic.trim()
        ? result.recommended_topic
        : "n/a";
    const activeTopic = selectedPredictionTopic || recommendedTopic;
    const isRecommendedActive = activeTopic === recommendedTopic;

    return (
      <div>
        <div style={styles.header}>ðŸ§­ Master Patterns</div>
        <div style={styles.sectionsContainer}>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Recommended Topic</h3>
            <div style={styles.sectionBody}>{recommendedTopic}</div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Predictions</h3>
            {normalizedPredictions.length > 0 ? (
              <div>
                {normalizedPredictions.map((p: any, idx: number) => (
                  <button
                    key={`${p.topic}-${idx}`}
                    onClick={() => setSelectedPredictionTopic(p.topic)}
                    style={{
                      ...styles.exerciseCard,
                      marginTop: idx === 0 ? 0 : "8px",
                      width: "100%",
                      textAlign: "left",
                      cursor: "pointer",
                      border:
                        activeTopic === p.topic
                          ? "2px solid #00ff88"
                          : "1px solid #555",
                    }}
                  >
                    <div style={styles.exerciseTitle}>
                      {idx + 1}. {p.topic}
                    </div>
                    <div style={styles.exerciseTask}>
                      score={p.score}, priority={p.priority}
                    </div>
                    <div style={{ ...styles.exerciseTask, marginTop: "6px" }}>
                      keywords: {p.keywords.length > 0 ? p.keywords.join(", ") : "none"}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div style={styles.sectionBody}>No predictions</div>
            )}
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Matched Keywords (All Topics)</h3>
            {Object.keys(matchedKeywords).length > 0 ? (
              <pre style={styles.jsonBlock}>{JSON.stringify(matchedKeywords, null, 2)}</pre>
            ) : (
              <div style={styles.sectionBody}>No keyword matches</div>
            )}
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Template Pseudocode</h3>
            {templatePseudocode && isRecommendedActive ? (
              <>
                <pre style={styles.codeBlock}>{templatePseudocode}</pre>
                <button
                  onClick={() => navigator.clipboard.writeText(templatePseudocode)}
                  style={styles.copyButton}
                >
                  Copy Code
                </button>
              </>
            ) : (
              <div style={styles.sectionBody}>
                {isRecommendedActive
                  ? "No template pseudocode available"
                  : `No template returned for '${activeTopic}'. Select '${recommendedTopic}' or run that topic directly.`}
              </div>
            )}
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Common Traps</h3>
            {traps.length > 0 && isRecommendedActive ? (
              <ul style={styles.examList}>
                {traps.map((item: string, idx: number) => (
                  <li key={idx} style={styles.examListItem}>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <div style={styles.sectionBody}>
                {isRecommendedActive
                  ? "No traps"
                  : `No trap list returned for '${activeTopic}'.`}
              </div>
            )}
          </div>

          {trapsFa.length > 0 && !isFa && isRecommendedActive && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>ØªÙˆØ¶ÛŒØ­ ÙØ§Ø±Ø³ÛŒ</h3>
              <ul style={styles.examList}>
                {trapsFa.map((item: string, idx: number) => (
                  <li key={idx} style={{ ...styles.examListItem, direction: "rtl", textAlign: "right", unicodeBidi: "plaintext" }}>
                    {renderBidiText(item, "fa")}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ ...styles.section, borderBottom: "none", marginBottom: 0, paddingBottom: 0 }}>
            <h3 style={styles.sectionTitle}>Next Steps</h3>
            {nextSteps.length > 0 && isRecommendedActive ? (
              <ul style={styles.examList}>
                {nextSteps.map((item: string, idx: number) => (
                  <li key={idx} style={styles.examListItem}>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <div style={styles.sectionBody}>
                {isRecommendedActive
                  ? "No next steps"
                  : `Choose '${activeTopic}' in Topic dropdown and run to get full content.`}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Legacy single-variant pseudocode mode
  if (result.pseudocode && typeof result.pseudocode === "string") {
    return (
      <div>
        <div style={styles.header}>
          ðŸ“ {result.algorithm || "Algorithm"} - {result.variant || ""}
        </div>
        <pre style={styles.codeBlock}>{result.pseudocode}</pre>
        <button
          onClick={() => navigator.clipboard.writeText(result.pseudocode)}
          style={styles.copyButton}
        >
          Copy Code
        </button>
      </div>
    );
  }

  // Generic trace result renderer for algorithm topics that return flat trace summaries
  // (e.g., insertionsort trace: { sorted, variant, algorithm, passes }).
  if (
    Array.isArray(result.sorted) &&
    (typeof result.algorithm === "string" || typeof result.variant === "string")
  ) {
    return (
      <div>
        <div style={styles.header}>
          📍 Trace Summary {result.algorithm ? `- ${result.algorithm}` : ""}
        </div>
        <div style={styles.keyValueContainer}>
          <div style={styles.keyValueRow}>
            <span style={styles.key}>sorted:</span>
            <span style={styles.value}>{JSON.stringify(result.sorted)}</span>
          </div>
          {typeof result.variant === "string" && (
            <div style={styles.keyValueRow}>
              <span style={styles.key}>variant:</span>
              <span style={styles.value}>{result.variant}</span>
            </div>
          )}
          {typeof result.passes === "number" && (
            <div style={styles.keyValueRow}>
              <span style={styles.key}>passes:</span>
              <span style={styles.value}>{String(result.passes)}</span>
            </div>
          )}
        </div>
        <div style={{ marginTop: "0.75rem", color: "#88ccff" }}>
          Open <b>Events</b> tab for step-by-step trace.
        </div>
      </div>
    );
  }

  // REMOVED: Legacy fallback for explain.content, explain.summary, etc.
  // All explain mode content MUST use sections[] array with strict schema
  
  // Final fallback: show structured data for debugging
  return (
    <div>
      <div style={{...styles.header, backgroundColor: "#ff9800"}}>
        âš ï¸ Unexpected Result Format
      </div>
      <div style={{marginTop: "1rem", color: "#ff6f00"}}>
        The result does not match any known format (sections, pseudocode, etc).
        This likely indicates a schema issue or unsupported mode.
      </div>
      <div style={styles.keyValueContainer}>
        {Object.entries(result).map(([key, value]) => (
          <div key={key} style={styles.keyValueRow}>
            <span style={styles.key}>{key}:</span>
            <span style={styles.value}>
              {typeof value === "object"
                ? JSON.stringify(value, null, 2)
                : String(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Render Schreibtischtest tab - desk-check table from trace events
 */
export function SchreibtischtestRenderer({ response }: BaseRendererProps) {
  const events = Array.isArray(response?.events) ? response.events : [];
  if (events.length === 0) {
    return <div style={styles.empty}>No events available for Schreibtischtest</div>;
  }

  const rows = events.map((ev: any, idx: number) => {
    const state = (ev && typeof ev === "object" ? ev.state : {}) || {};
    const indices = (state && typeof state === "object" ? state.indices : {}) || {};
    const details = (ev?.action && typeof ev.action === "object" ? ev.action.details : {}) || {};
    const iVal = indices.i ?? indices.pass ?? details.i ?? "";
    const jVal = indices.j ?? details.j ?? "";
    const keyVal = details.key_value ?? details.key ?? "";
    const arr = Array.isArray(state.array) ? JSON.stringify(state.array) : "";
    const label =
      ev?.messages?.de ||
      ev?.messages?.fa ||
      ev?.action?.type ||
      ev?.type ||
      "";

    return {
      step: typeof ev?.id === "number" ? ev.id : idx + 1,
      type: String(ev?.type ?? ""),
      i: String(iVal),
      j: String(jVal),
      key: String(keyVal),
      array: arr,
      note: String(label),
    };
  });

  return (
    <div>
      <div style={styles.header}>Schreibtischtest</div>
      <div style={styles.sectionsContainer}>
        <div style={styles.sectionBody}>
          Use this table to follow each step manually (IHK desk-check style).
        </div>
        <div style={{ overflowX: "auto", marginTop: "12px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={styles.examTableHeader}>Step</th>
                <th style={styles.examTableHeader}>Type</th>
                <th style={styles.examTableHeader}>i</th>
                <th style={styles.examTableHeader}>j</th>
                <th style={styles.examTableHeader}>key</th>
                <th style={styles.examTableHeader}>Array</th>
                <th style={styles.examTableHeader}>Note</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.step}-${r.type}-${r.i}-${r.j}`}>
                  <td style={styles.examTableCell}>{r.step}</td>
                  <td style={styles.examTableCell}>{r.type}</td>
                  <td style={styles.examTableCell}>{r.i}</td>
                  <td style={styles.examTableCell}>{r.j}</td>
                  <td style={styles.examTableCell}>{r.key}</td>
                  <td style={{ ...styles.examTableCell, fontFamily: "monospace" }}>{r.array}</td>
                  <td style={styles.examTableCell}>{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * Render Events tab - shows trace events in a table
 */
export function EventsRenderer({
  response,
  lang,
  eventIndex,
  onEventChange,
}: BaseRendererProps & {
  eventIndex: number;
  onEventChange: (index: number) => void;
}) {
  const events = response?.events || [];

  if (events.length === 0) {
    return <div style={styles.empty}>No events in this execution</div>;
  }

  const currentEvent = events[eventIndex] || events[0];

  return (
    <div>
      {/* Navigation */}
      <div style={styles.eventNav}>
        <button
          onClick={() => onEventChange(0)}
          disabled={eventIndex === 0}
          style={styles.navButton}
        >
          First
        </button>
        <button
          onClick={() => onEventChange(Math.max(0, eventIndex - 1))}
          disabled={eventIndex === 0}
          style={styles.navButton}
        >
          â† Prev
        </button>
        <span style={styles.eventCounter}>
          Event {eventIndex + 1} / {events.length}
        </span>
        <button
          onClick={() => onEventChange(Math.min(events.length - 1, eventIndex + 1))}
          disabled={eventIndex >= events.length - 1}
          style={styles.navButton}
        >
          Next â†’
        </button>
        <button
          onClick={() => onEventChange(events.length - 1)}
          disabled={eventIndex >= events.length - 1}
          style={styles.navButton}
        >
          Last
        </button>
      </div>

      {/* Current event */}
      <div style={styles.eventCard}>
        <div style={styles.eventHeader}>
          Event #{currentEvent.id || eventIndex + 1} - {currentEvent.type || "step"}
        </div>

        {/* Messages */}
        {currentEvent.messages && currentEvent.messages[lang] && (
          <div style={styles.messagesContainer}>
            {Array.isArray(currentEvent.messages[lang]) &&
              currentEvent.messages[lang].map((msg: string, idx: number) => (
                <div key={idx} style={styles.message}>
                  {msg}
                </div>
              ))}
          </div>
        )}

        {/* Event details */}
        <details style={{ marginTop: "1rem" }}>
          <summary style={styles.detailsSummary}>Show Details</summary>
          <pre style={styles.detailsContent}>
            {JSON.stringify(currentEvent, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}

/**
 * Render Questions tab - shows quiz questions as cards
 */
export function QuestionsRenderer({ response }: BaseRendererProps) {
  const result = response?.result as any;
  const questions = result?.questions || [];

  if (!Array.isArray(questions) || questions.length === 0) {
    return <div style={styles.empty}>No questions available for this mode</div>;
  }

  return (
    <div>
      {questions.map((q: any, idx: number) => (
        <QuestionCard key={idx} question={q} index={idx} />
      ))}
    </div>
  );
}

function QuestionCard({ question, index }: { question: any; index: number }) {
  const [showAnswer, setShowAnswer] = React.useState(false);

  return (
    <div style={styles.questionCard}>
      <div style={styles.questionHeader}>Question {index + 1}</div>
      <div style={styles.questionText}>
        {question.question || question.text || JSON.stringify(question)}
      </div>

      {question.options && Array.isArray(question.options) && (
        <div style={styles.optionsContainer}>
          {question.options.map((opt: any, optIdx: number) => (
            <div
              key={optIdx}
              style={{
                ...styles.option,
                ...(question.correct === optIdx ? styles.optionCorrect : {}),
              }}
            >
              {String.fromCharCode(65 + optIdx)}) {typeof opt === "string" ? opt : opt.text || JSON.stringify(opt)}
            </div>
          ))}
        </div>
      )}

      {question.answer && (
        <div style={{ marginTop: "1rem" }}>
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            style={styles.toggleButton}
          >
            {showAnswer ? "Hide" : "Show"} Answer
          </button>
          {showAnswer && (
            <div style={styles.answer}>
              {question.answer}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Render Stats tab - shows statistics as cards
 */
export function StatsRenderer({ response }: BaseRendererProps) {
  const stats = response?.stats || {};

  if (typeof stats !== "object" || Object.keys(stats).length === 0) {
    return <div style={styles.empty}>No statistics for this execution</div>;
  }

  return (
    <div style={styles.statsGrid}>
      {Object.entries(stats).map(([key, value]: [string, any]) => (
        <div key={key} style={styles.statCard}>
          <div style={styles.statLabel}>{key.replace(/_/g, " ")}</div>
          <div style={styles.statValue}>
            {typeof value === "number" ? value.toLocaleString() : String(value)}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Render Raw JSON tab
 */
export function RawJsonRenderer({ rawJson }: { rawJson: string | null }) {
  if (!rawJson) {
    return <div style={styles.empty}>No response data</div>;
  }

  return (
    <div>
      <button
        onClick={() => navigator.clipboard.writeText(rawJson)}
        style={styles.copyButton}
      >
        Copy JSON
      </button>
      <pre style={styles.jsonBlock}>{rawJson}</pre>
    </div>
  );
}

/**
 * Render Logs tab
 */
export function LogsRenderer({ logs }: { logs: string[] }) {
  if (logs.length === 0) {
    return <div style={styles.empty}>No logs yet</div>;
  }

  return (
    <div style={styles.logsContainer}>
      {logs.map((log, idx) => (
        <div key={idx} style={styles.logEntry}>
          <span style={styles.logIndex}>[{idx + 1}]</span>
          {log}
        </div>
      ))}
    </div>
  );
}

// Styles
const styles = {
  empty: {
    padding: "2rem",
    textAlign: "center" as const,
    color: "#888",
    fontStyle: "italic" as const,
  },
  header: {
    background: "#1a3a1a",
    color: "#88ff88",
    padding: "12px",
    borderRadius: "8px 8px 0 0",
    fontWeight: "bold" as const,
    borderBottom: "2px solid #00ff88",
  },
  codeBlock: {
    background: "#0d1b0d",
    color: "#00ff88",
    padding: "18px",
    borderRadius: "0 0 8px 8px",
    fontSize: "15px",
    lineHeight: "1.6",
    fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
    overflowX: "auto" as const,
    whiteSpace: "pre" as const,
    direction: "ltr" as const,
    textAlign: "left" as const,
  },
  explainText: {
    background: "#1a1a2a",
    color: "#e0e0ff",
    padding: "18px",
    borderRadius: "0 0 8px 8px",
    fontSize: "16px",
    lineHeight: "1.6",
    whiteSpace: "pre-wrap" as const,
    fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Tahoma', 'Arial', sans-serif",
  },
  sectionsContainer: {
    background: "#1a1a2a",
    borderRadius: "0 0 8px 8px",
    padding: "12px",
  },
  section: {
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: "1px solid #333",
  },
  sectionTitle: {
    color: "#88ff88",
    fontSize: "18px",
    fontWeight: "bold" as const,
    marginBottom: "12px",
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
  sectionBody: {
    color: "#e0e0ff",
    fontSize: "15px",
    lineHeight: "1.7",
    whiteSpace: "pre-wrap" as const,
    fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Tahoma', 'Arial', sans-serif",
  },
  keyValueContainer: {
    background: "#1a1a1a",
    padding: "16px",
    borderRadius: "0 0 8px 8px",
  },
  keyValueRow: {
    padding: "8px 0",
    borderBottom: "1px solid #333",
  },
  key: {
    color: "#88ccff",
    fontWeight: "bold" as const,
    marginRight: "12px",
  },
  value: {
    color: "#cccccc",
    fontFamily: "monospace",
  },
  eventNav: {
    display: "flex",
    gap: "8px",
    marginBottom: "16px",
    alignItems: "center" as const,
  },
  navButton: {
    padding: "6px 12px",
    background: "#333",
    color: "#fff",
    border: "1px solid #555",
    borderRadius: "4px",
    cursor: "pointer" as const,
  },
  eventCounter: {
    color: "#aaa",
    fontSize: "14px",
    margin: "0 8px",
  },
  eventCard: {
    background: "#1a1a2a",
    borderRadius: "8px",
    padding: "16px",
    border: "2px solid #4488ff",
  },
  eventHeader: {
    color: "#88ccff",
    fontWeight: "bold" as const,
    fontSize: "16px",
    marginBottom: "12px",
  },
  messagesContainer: {
    marginTop: "12px",
  },
  message: {
    background: "#0d1a2a",
    padding: "10px 12px",
    marginBottom: "6px",
    borderRadius: "4px",
    color: "#88ccff",
    borderLeft: "3px solid #00ccff",
    fontSize: "14px",
    lineHeight: "1.5",
  },
  detailsSummary: {
    cursor: "pointer" as const,
    color: "#ff88ff",
    userSelect: "none" as const,
  },
  detailsContent: {
    background: "#1a0d1a",
    color: "#ff88ff",
    padding: "12px",
    borderRadius: "4px",
    fontSize: "13px",
    marginTop: "8px",
    overflowX: "auto" as const,
  },
  questionCard: {
    background: "#2a2a1a",
    border: "2px solid #ffaa00",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px",
  },
  questionHeader: {
    color: "#ffaa00",
    fontWeight: "bold" as const,
    marginBottom: "12px",
    fontSize: "16px",
  },
  questionText: {
    color: "#ffcc66",
    marginBottom: "12px",
    fontSize: "14px",
    lineHeight: "1.5",
  },
  optionsContainer: {
    marginTop: "12px",
  },
  option: {
    background: "#1a1a0d",
    padding: "8px 12px",
    marginBottom: "4px",
    borderRadius: "4px",
    color: "#ffdd88",
    border: "1px solid #444",
  },
  optionCorrect: {
    border: "2px solid #00ff88",
    background: "#0d1a0d",
  },
  toggleButton: {
    padding: "6px 12px",
    background: "#ffaa00",
    color: "#000",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer" as const,
    fontWeight: "bold" as const,
  },
  answer: {
    marginTop: "8px",
    padding: "12px",
    background: "#1a1a0d",
    color: "#ffcc66",
    borderRadius: "4px",
    borderLeft: "3px solid #00ff88",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
  },
  statCard: {
    background: "linear-gradient(135deg, #2a1a3a 0%, #1a1a2a 100%)",
    border: "2px solid #ff88ff",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center" as const,
  },
  statLabel: {
    color: "#ff88ff",
    fontSize: "12px",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
    marginBottom: "8px",
    fontWeight: "bold" as const,
  },
  statValue: {
    color: "#ffccff",
    fontSize: "32px",
    fontWeight: "bold" as const,
    fontFamily: "'Courier New', monospace",
  },
  jsonBlock: {
    background: "#1a1a1a",
    color: "#cccccc",
    padding: "16px",
    borderRadius: "8px",
    fontSize: "13px",
    overflowX: "auto" as const,
    whiteSpace: "pre" as const,
    direction: "ltr" as const,
    textAlign: "left" as const,
  },
  logsContainer: {
    background: "#0d1b0d",
    padding: "16px",
    borderRadius: "8px",
    maxHeight: "400px",
    overflowY: "auto" as const,
  },
  logEntry: {
    color: "#00ff88",
    fontFamily: "'Cascadia Code', monospace",
    fontSize: "12px",
    padding: "4px 0",
    borderBottom: "1px solid #1a3a1a",
  },
  logIndex: {
    color: "#888",
    marginRight: "8px",
  },
  copyButton: {
    padding: "8px 16px",
    background: "#0066cc",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer" as const,
    marginBottom: "12px",
    fontWeight: "bold" as const,
  },
  variantSelector: {
    display: "flex",
    alignItems: "center" as const,
    gap: "12px",
    marginBottom: "16px",
    padding: "12px",
    background: "#1a1a2a",
    borderRadius: "8px",
    border: "1px solid #4488ff",
  },
  variantLabel: {
    color: "#88ccff",
    fontWeight: "bold" as const,
    fontSize: "14px",
  },
  variantDropdown: {
    flex: 1,
    padding: "8px 12px",
    background: "#0d1a2a",
    color: "#fff",
    border: "1px solid #555",
    borderRadius: "4px",
    fontSize: "14px",
    cursor: "pointer" as const,
  },
  variantExplain: {
    marginTop: "16px",
    padding: "16px",
    background: "#1a2a1a",
    borderRadius: "8px",
    border: "2px solid #66bb66",
  },
  variantExplainLabel: {
    color: "#88ff88",
    fontWeight: "bold" as const,
    fontSize: "14px",
    marginBottom: "8px",
  },
  variantExplainText: {
    color: "#ccffcc",
    fontSize: "14px",
    lineHeight: "1.6",
    whiteSpace: "pre-wrap" as const,
  },
  exerciseCard: {
    background: "#1a1a2a",
    padding: "12px",
    marginTop: "12px",
    borderRadius: "6px",
    border: "1px solid #555",
  },
  exerciseTitle: {
    color: "#88ccff",
    fontWeight: "bold" as const,
    fontSize: "15px",
    marginBottom: "8px",
  },
  exerciseTask: {
    color: "#e0e0ff",
    lineHeight: "1.6",
  },
  examSection: {
    marginTop: "16px",
    padding: "12px",
    background: "#1a1a2a",
    borderRadius: "8px",
    border: "1px solid #4488ff",
  },
  examLabel: {
    color: "#88ccff",
    fontWeight: "bold" as const,
    marginBottom: "8px",
  },
  examText: {
    color: "#e0e0ff",
    fontSize: "15px",
    lineHeight: "1.6",
    whiteSpace: "pre-wrap" as const,
  },
  examList: {
    margin: 0,
    paddingLeft: "20px",
  },
  examListItem: {
    color: "#e0e0ff",
    marginBottom: "6px",
  },
  examSolution: {
    marginTop: "8px",
    padding: "12px",
    background: "#1a1a0d",
    color: "#ffcc66",
    borderRadius: "4px",
    borderLeft: "3px solid #00ff88",
    whiteSpace: "pre-wrap" as const,
  },
  examTableHeader: {
    textAlign: "left" as const,
    padding: "6px",
    color: "#88ccff",
    borderBottom: "1px solid #333",
    fontSize: "12px",
  },
  examTableCell: {
    padding: "6px",
    borderBottom: "1px solid #222",
    color: "#e0e0ff",
    fontSize: "12px",
  },
  answerInput: {
    width: "100%",
    minHeight: "80px",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #333",
    background: "#0f0f0f",
    color: "#e0e0ff",
    fontSize: "14px",
    lineHeight: "1.6",
    fontFamily: "inherit",
    resize: "vertical" as const,
  },
};

