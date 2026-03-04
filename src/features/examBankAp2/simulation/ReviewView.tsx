import { ExamQuestion, SimulationSession } from "./types";

type ReviewViewProps = {
  session: SimulationSession;
  question: ExamQuestion | null;
  onPrev: () => void;
  onNext: () => void;
  onJump: (idx: number) => void;
  onMarkCorrect: (value: boolean | null) => void;
  onFinalize: () => void;
};

export function ReviewView({
  session,
  question,
  onPrev,
  onNext,
  onJump,
  onMarkCorrect,
  onFinalize,
}: ReviewViewProps) {
  if (!question) return <div style={styles.panel}>No review data.</div>;
  const item = session.items[question.id];
  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <strong>Review</strong>
        <span>
          {session.currentIndex + 1} / {session.itemOrder.length}
        </span>
      </div>
      <div style={styles.question}>{question.question}</div>
      <div style={styles.answerPanel}>
        <div>{question.answer_short}</div>
        <div style={styles.keywords}>
          {question.keywords.map((kw) => (
            <span key={kw} style={styles.keywordChip}>
              {kw}
            </span>
          ))}
        </div>
        <div style={styles.trapsPanel}>
          <strong>Exam Traps</strong>
          <ul style={styles.trapsList}>
            {question.traps.map((trap) => (
              <li key={trap}>{trap}</li>
            ))}
          </ul>
        </div>
      </div>
      <div style={styles.selfCheck}>
        <span>Self-check:</span>
        <button
          type="button"
          style={{ ...styles.evalBtn, ...(item.userAnswer.isCorrect === true ? styles.evalBtnActive : {}) }}
          onClick={() => onMarkCorrect(true)}
        >
          Correct
        </button>
        <button
          type="button"
          style={{ ...styles.evalBtn, ...(item.userAnswer.isCorrect === false ? styles.evalBtnActive : {}) }}
          onClick={() => onMarkCorrect(false)}
        >
          Incorrect
        </button>
        <button
          type="button"
          style={{ ...styles.evalBtn, ...(item.userAnswer.isCorrect === null ? styles.evalBtnActive : {}) }}
          onClick={() => onMarkCorrect(null)}
        >
          Unset
        </button>
      </div>
      <div style={styles.actions}>
        <button type="button" style={styles.secondaryBtn} onClick={onPrev}>
          Previous
        </button>
        <button type="button" style={styles.secondaryBtn} onClick={onNext}>
          Next
        </button>
        <button type="button" style={styles.primaryBtn} onClick={onFinalize}>
          Compute Result
        </button>
      </div>
      <div style={styles.navigator}>
        {session.itemOrder.map((qid, idx) => (
          <button
            key={qid}
            type="button"
            onClick={() => onJump(idx)}
            style={{ ...styles.navBtn, ...(idx === session.currentIndex ? styles.navBtnActive : {}) }}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  panel: {
    border: "1px solid #2b3b50",
    borderRadius: "8px",
    background: "#0f1724",
    padding: "0.85rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  question: {
    marginTop: "0.65rem",
    fontSize: "15px",
    lineHeight: 1.45,
  },
  answerPanel: {
    marginTop: "0.65rem",
    border: "1px solid #32533d",
    background: "#0f1f15",
    borderRadius: "8px",
    padding: "0.6rem",
    display: "grid",
    gap: "0.45rem",
  },
  keywords: {
    display: "flex",
    gap: "0.35rem",
    flexWrap: "wrap" as const,
  },
  keywordChip: {
    border: "1px solid #4a7854",
    background: "#1f2d22",
    borderRadius: "999px",
    padding: "0.12rem 0.42rem",
    fontSize: "11px",
  },
  trapsPanel: {
    border: "1px solid #8f7540",
    background: "#2b2212",
    borderRadius: "6px",
    padding: "0.5rem",
    color: "#ffdca2",
  },
  trapsList: {
    margin: "0.35rem 0 0 1rem",
    padding: 0,
  },
  selfCheck: {
    marginTop: "0.6rem",
    display: "flex",
    gap: "0.4rem",
    alignItems: "center",
    flexWrap: "wrap" as const,
  },
  evalBtn: {
    border: "1px solid #4b607c",
    background: "#1b2738",
    color: "#d9e6f6",
    borderRadius: "6px",
    padding: "0.34rem 0.6rem",
    cursor: "pointer" as const,
  },
  evalBtnActive: {
    borderColor: "#7db6ff",
    background: "#254261",
  },
  actions: {
    marginTop: "0.65rem",
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap" as const,
  },
  primaryBtn: {
    padding: "0.42rem 0.75rem",
    borderRadius: "6px",
    border: "1px solid #2f5d8a",
    background: "#1b3e63",
    color: "#e3f1ff",
    cursor: "pointer" as const,
  },
  secondaryBtn: {
    padding: "0.42rem 0.75rem",
    borderRadius: "6px",
    border: "1px solid #425774",
    background: "#1a2433",
    color: "#d9e5f5",
    cursor: "pointer" as const,
  },
  navigator: {
    marginTop: "0.75rem",
    display: "flex",
    gap: "0.3rem",
    flexWrap: "wrap" as const,
  },
  navBtn: {
    width: "34px",
    height: "34px",
    borderRadius: "6px",
    border: "1px solid #3f536d",
    background: "#1a2230",
    color: "#d5e0ef",
    cursor: "pointer" as const,
    fontSize: "12px",
  },
  navBtnActive: {
    borderColor: "#7cb6ff",
    background: "#243b5a",
  },
};
