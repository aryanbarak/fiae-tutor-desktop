import React from "react";
import DirBlock from "./DirBlock";
import { ExamSessionState, ExamSessionItem, scoreAnswer } from "../utils/examSessionScoring";

const DEBUG_UI = import.meta.env.VITE_DEBUG_UI === "true";

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
      "Damit l und r unverändert bleiben",
    ],
    fa: [
      "برای جلوگیری از overflow",
      "چون (l+r)//2 سریع‌تر است",
      "چون همیشه رو به بالا گرد می‌کند",
      "برای اینکه l و r تغییر نکنند",
    ],
  },
};

function detectExerciseType(exId: string, task: string): ExerciseType {
  if (exId && EXERCISE_TYPES[exId]) return EXERCISE_TYPES[exId];
  const t = task.toLowerCase();
  if (t.includes("welche") && t.includes("bedingung")) return "short_text";
  if (t.includes("wie viele") || t.includes("anzahl") || t.includes("چند") || t.includes("تعداد")) return "numeric";
  if (t.includes("komplex") || t.includes("big-o") || t.includes("o(")) return "formula";
  if (t.includes("trace") || t.includes("zustand") || t.includes("nach i") || t.includes("بعد از")) return "trace_steps";
  return "short_text";
}

const LTR_CHUNK = /([A-Za-z0-9_]+(?:[./:+\-*()=<>,'"\[\]]*[A-Za-z0-9_]+)*)/g;

function renderBidiInline(text: string): React.ReactNode {
  if (!text) return text;
  const parts = text.split(LTR_CHUNK);
  return (
    <>
      {parts.map((part, idx) =>
        /^[A-Za-z0-9_]+/.test(part) ? (
          <bdi key={idx} dir="ltr" className="bidi-ltr">{part}</bdi>
        ) : (
          <React.Fragment key={idx}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

function normalizeExamSession(raw: any, resultTopic: string) {
  if (Array.isArray(raw?.exercises) && raw.exercises.length > 0) {
    const total =
      typeof raw.total === "number" && raw.total > 0
        ? raw.total
        : raw.exercises.length;
    return {
      topic: raw.topic || raw.meta?.topic || resultTopic || "",
      total,
      exercises: raw.exercises,
    };
  }
  return {
    topic: raw.topic || raw.meta?.topic || resultTopic || "",
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
}

interface ExamSessionRendererProps {
  result: any;
  lang: "de" | "fa" | "bi";
}

export function ExamSessionRenderer({ result, lang }: ExamSessionRendererProps) {
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

  const exam = result.exam_session || {};
  const isFa = lang === "fa";

  const normalized = normalizeExamSession(exam, result.topic || "");
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
      ? [...traps, "نمونه: شرط low <= high را بررسی کن."]
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
    answerLabel: isFa ? "پاسخ" : "Answer",
    answerPlaceholder: isFa ? "پاسخ خود را بنویسید..." : "Type your answer...",
    checkAnswer: isFa ? "بررسی پاسخ" : "Check Answer",
    noExpected: isFa
      ? "پاسخ رسمی ندارد؛ از راه‌حل استفاده کن."
      : "No official expected answer; use solution as guidance.",
    correct: isFa ? "✅ درست است." : "✅ Correct.",
    wrong: isFa ? "❌ نادرست است. قالب پاسخ را با Expected مقایسه کن." : "❌ Incorrect. Compare with expected format.",
    firstTry: isFa ? "اول جواب بده." : "First try answering.",
    score: isFa ? "امتیاز" : "Score",
    expectedLabel: isFa ? "پاسخ مورد انتظار" : "Expected",
    typeLabel: isFa ? "نوع سوال" : "Type",
    modeLabel: isFa ? "حالت" : "Mode",
    learn: isFa ? "آموزشی" : "Learn",
    exam: isFa ? "امتحان" : "Exam",
    timer: isFa ? "زمان‌سنج" : "Timer",
    submit: isFa ? "ثبت پاسخ" : "Submit",
    hint: isFa ? "نمایش راهنما" : "Show hint",
    summary: isFa ? "خلاصه جلسه" : "Session Summary",
    export: isFa ? "خروجی JSON جلسه" : "Export session JSON",
    timeLeft: isFa ? "زمان باقی‌مانده" : "Time left",
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
  const exerciseDuration = durationMap[exerciseId] ?? 90;

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
          style={{ ...styles.examText, unicodeBidi: "plaintext" }}
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
        ) : exerciseType === "formula" || exerciseType === "short_text" ? (
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
          <button onClick={() => handleSubmit(false)} style={styles.toggleButton}>
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
        {((currentState.checked && !currentState.isCorrect && expected.trim()) ||
          (currentState.revealed && expected.trim())) && (
          <div style={{ marginTop: "8px" }}>
            <div style={styles.examLabel}>{t.expectedLabel}</div>
            <DirBlock rtl={isFa} style={styles.examSolution}>
              {expected}
            </DirBlock>
          </div>
        )}
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
                    [stateKey]: { ...currentState, hintUsed: true },
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
                      <DirBlock rtl={isFa}>{trap}</DirBlock>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <ul style={styles.examList}>
              {displayTraps.map((trap: string, idx: number) => (
                <li key={idx} style={styles.examListItem}>
                  <DirBlock rtl={isFa}>{trap}</DirBlock>
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
          <DirBlock rtl={isFa} style={styles.examSolution}>
            {expected}
          </DirBlock>
        )}
        {!hasSolution && !hasExpected && (
          <div style={styles.examSolution}>No solution available for this exercise.</div>
        )}
        {isOpen && hasSolution && (
          <DirBlock rtl={isFa} style={styles.examSolution}>
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
              <div style={styles.examLabel}>Time: {session.totals.total_time_sec}s</div>
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
                    <td style={styles.examTableCell}>{item.is_correct ? "✅" : "❌"}</td>
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
                const blob = new Blob([JSON.stringify(session, null, 2)], {
                  type: "application/json",
                });
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

const styles = {
  header: {
    background: "#1a3a1a",
    color: "#88ff88",
    padding: "12px",
    borderRadius: "8px 8px 0 0",
    fontWeight: "bold" as const,
    borderBottom: "2px solid #00ff88",
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
  navButton: {
    padding: "6px 12px",
    background: "#333",
    color: "#fff",
    border: "1px solid #555",
    borderRadius: "4px",
    cursor: "pointer" as const,
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
};
