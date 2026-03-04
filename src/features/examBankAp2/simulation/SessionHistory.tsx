import { SimulationSession } from "./types";

type SessionHistoryProps = {
  sessions: SimulationSession[];
  onReplay: (session: SimulationSession) => void;
};

export function SessionHistory({ sessions, onReplay }: SessionHistoryProps) {
  if (sessions.length === 0) {
    return <div style={styles.panel}>No saved sessions yet.</div>;
  }

  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>Simulation History</h3>
      <div style={styles.list}>
        {sessions.map((session) => (
          <div key={session.sessionId} style={styles.card}>
            <div style={styles.row}>
              <strong>{session.sessionId}</strong>
              <span>{new Date(session.createdAt).toLocaleString()}</span>
            </div>
            <div style={styles.meta}>
              seed={session.seed} | count={session.itemOrder.length} | duration={session.durationSec}s
            </div>
            {session.summary && (
              <div style={styles.meta}>
                score={session.summary.scorePercent}% ({session.summary.correct}/{session.summary.total})
              </div>
            )}
            <button type="button" style={styles.replayBtn} onClick={() => onReplay(session)}>
              Replay session
            </button>
          </div>
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
  title: {
    margin: "0 0 0.75rem 0",
    color: "#a5d7ff",
  },
  list: {
    display: "grid",
    gap: "0.6rem",
  },
  card: {
    border: "1px solid #32485f",
    borderRadius: "6px",
    background: "#152235",
    padding: "0.65rem",
    display: "grid",
    gap: "0.3rem",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    gap: "0.5rem",
    fontSize: "13px",
  },
  meta: {
    fontSize: "12px",
    opacity: 0.9,
  },
  replayBtn: {
    justifySelf: "start" as const,
    marginTop: "0.25rem",
    padding: "0.36rem 0.65rem",
    borderRadius: "6px",
    border: "1px solid #426085",
    background: "#1f3450",
    color: "#d8ebff",
    cursor: "pointer" as const,
  },
};
