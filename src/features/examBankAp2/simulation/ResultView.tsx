import { SimulationSession } from "./types";

type ResultViewProps = {
  session: SimulationSession;
  onReplayCurrent: () => void;
  onBackToSetup: () => void;
};

export function ResultView({ session, onReplayCurrent, onBackToSetup }: ResultViewProps) {
  const summary = session.summary;
  if (!summary) return <div style={styles.panel}>No result summary available.</div>;
  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>Result</h3>
      <div style={styles.statsGrid}>
        <div style={styles.statItem}>Score: {summary.scorePercent}%</div>
        <div style={styles.statItem}>
          Correct: {summary.correct} / {summary.total}
        </div>
        <div style={styles.statItem}>Avg time/question: {summary.avgTimePerQuestionSec}s</div>
      </div>
      <div style={styles.breakdown}>
        {Object.entries(summary.breakdownByCategory).map(([category, data]) => (
          <div key={category} style={styles.breakdownItem}>
            <strong>{category}</strong>: {data.correct}/{data.total}
          </div>
        ))}
      </div>
      <div style={styles.actions}>
        <button type="button" style={styles.secondaryBtn} onClick={onReplayCurrent}>
          Review Session
        </button>
        <button type="button" style={styles.primaryBtn} onClick={onBackToSetup}>
          New Simulation
        </button>
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
  title: {
    margin: "0 0 0.65rem 0",
    color: "#9ceab6",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "0.45rem",
  },
  statItem: {
    border: "1px solid #344a63",
    borderRadius: "6px",
    background: "#162233",
    padding: "0.5rem",
  },
  breakdown: {
    marginTop: "0.65rem",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "0.4rem",
  },
  breakdownItem: {
    border: "1px solid #324961",
    borderRadius: "6px",
    background: "#142132",
    padding: "0.45rem",
    fontSize: "13px",
  },
  actions: {
    marginTop: "0.8rem",
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
};
