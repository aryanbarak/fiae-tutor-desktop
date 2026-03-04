import { ExamQuestion, SimulationSession } from "./types";

type RunningViewProps = {
  session: SimulationSession;
  question: ExamQuestion | null;
  remainingSec: number;
  onPrev: () => void;
  onNext: () => void;
  onJump: (idx: number) => void;
  onToggleFlag: () => void;
  onFinish: () => void;
  onAnswerTextChange: (text: string) => void;
};

export function RunningView({
  session,
  question,
  remainingSec,
  onPrev,
  onNext,
  onJump,
  onToggleFlag,
  onFinish,
  onAnswerTextChange,
}: RunningViewProps) {
  if (!question) {
    return <div style={styles.panel}>No questions in session.</div>;
  }
  const currentItem = session.items[question.id];
  const minutes = Math.floor(Math.max(0, remainingSec) / 60);
  const seconds = Math.max(0, remainingSec) % 60;

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span>Running</span>
        <span style={styles.timer}>
          Time left: {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
      </div>
      <div style={styles.progress}>
        {session.currentIndex + 1} / {session.itemOrder.length}
      </div>
      <div style={styles.questionMeta}>
        <span style={styles.badge}>{question.category}</span>
        <span style={styles.badge}>{question.difficulty}</span>
        <span style={styles.badge}>{question.id}</span>
      </div>
      <div style={styles.question}>{question.question}</div>
      <textarea
        value={currentItem.userAnswer.text}
        onChange={(e) => onAnswerTextChange(e.target.value)}
        placeholder="Write your own answer draft (not graded automatically)"
        style={styles.textarea}
      />
      <div style={styles.actions}>
        <button type="button" style={styles.secondaryBtn} onClick={onPrev}>
          Previous
        </button>
        <button type="button" style={styles.secondaryBtn} onClick={onToggleFlag}>
          {currentItem.flagged ? "Unflag" : "Flag"}
        </button>
        <button type="button" style={styles.secondaryBtn} onClick={onNext}>
          Next
        </button>
        <button type="button" style={styles.primaryBtn} onClick={onFinish}>
          Finish
        </button>
      </div>
      <div style={styles.navigator}>
        {session.itemOrder.map((qid, idx) => {
          const item = session.items[qid];
          return (
            <button
              key={qid}
              type="button"
              onClick={() => onJump(idx)}
              style={{
                ...styles.navBtn,
                ...(idx === session.currentIndex ? styles.navBtnActive : {}),
                ...(item.flagged ? styles.navBtnFlagged : {}),
              }}
            >
              {idx + 1}
            </button>
          );
        })}
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
    fontWeight: 700,
  },
  timer: {
    color: "#ffd580",
  },
  progress: {
    marginTop: "0.4rem",
    fontSize: "13px",
    opacity: 0.9,
  },
  questionMeta: {
    display: "flex",
    gap: "0.35rem",
    marginTop: "0.45rem",
    flexWrap: "wrap" as const,
  },
  badge: {
    fontSize: "11px",
    border: "1px solid #3a5472",
    borderRadius: "999px",
    padding: "0.1rem 0.4rem",
    background: "#1a2739",
  },
  question: {
    marginTop: "0.7rem",
    lineHeight: 1.45,
    fontSize: "15px",
  },
  textarea: {
    marginTop: "0.65rem",
    width: "100%",
    minHeight: "110px",
    borderRadius: "6px",
    border: "1px solid #3b4e67",
    background: "#131f31",
    color: "#dbe8f7",
    padding: "0.5rem",
    resize: "vertical" as const,
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
  navBtnFlagged: {
    borderColor: "#e7b35d",
    color: "#ffd590",
  },
};
