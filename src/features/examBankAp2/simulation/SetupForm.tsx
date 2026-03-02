import { DifficultyPreset, ExamCategory, SessionConfig } from "./types";

const CATEGORY_OPTIONS: Array<"all" | ExamCategory> = [
  "all",
  "algorithms",
  "testing",
  "oop",
  "database",
  "web_http",
  "complexity",
  "general_cs",
  "ihk_2022",
  "ihk_2023",
  "ihk_2024",
];

const DIFFICULTY_PRESETS: DifficultyPreset[] = ["all", "balanced", "easy_focus", "medium_focus", "hard_focus"];

type SetupFormProps = {
  config: SessionConfig;
  onConfigChange: (next: SessionConfig) => void;
  onStart: () => void;
  onAutoSeed: () => void;
  availableCount: number;
};

export function SetupForm({ config, onConfigChange, onStart, onAutoSeed, availableCount }: SetupFormProps) {
  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>Simulation Setup</h3>
      <div style={styles.grid}>
        <label style={styles.label}>
          Category
          <select
            value={config.category}
            onChange={(e) => onConfigChange({ ...config, category: e.target.value as SessionConfig["category"] })}
            style={styles.select}
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label style={styles.label}>
          Difficulty Mix
          <select
            value={config.difficultyPreset}
            onChange={(e) =>
              onConfigChange({ ...config, difficultyPreset: e.target.value as DifficultyPreset })
            }
            style={styles.select}
          >
            {DIFFICULTY_PRESETS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label style={styles.label}>
          Duration (minutes)
          <input
            type="number"
            min={5}
            max={180}
            value={config.durationMin}
            onChange={(e) =>
              onConfigChange({ ...config, durationMin: Math.max(5, Number(e.target.value || 20)) })
            }
            style={styles.input}
          />
        </label>
        <label style={styles.label}>
          Count
          <input
            type="number"
            min={1}
            max={availableCount}
            value={config.count}
            onChange={(e) =>
              onConfigChange({
                ...config,
                count: Math.max(1, Math.min(availableCount, Number(e.target.value || 20))),
              })
            }
            style={styles.input}
          />
        </label>
        <label style={styles.label}>
          Seed
          <input
            type="number"
            value={config.seed}
            onChange={(e) => onConfigChange({ ...config, seed: Number(e.target.value || 1) })}
            style={styles.input}
          />
        </label>
      </div>
      <div style={styles.actions}>
        <button type="button" style={styles.secondaryBtn} onClick={onAutoSeed}>
          New deterministic seed
        </button>
        <button type="button" style={styles.primaryBtn} onClick={onStart}>
          Start Simulation
        </button>
      </div>
      <div style={styles.helper}>Available questions in pool: {availableCount}</div>
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
    margin: "0 0 0.8rem 0",
    color: "#a5d7ff",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "0.65rem",
  },
  label: {
    display: "grid",
    gap: "0.3rem",
    fontSize: "13px",
  },
  select: {
    padding: "0.4rem 0.55rem",
    borderRadius: "6px",
    border: "1px solid #3a4d67",
    background: "#131f31",
    color: "#d9e5f5",
  },
  input: {
    padding: "0.4rem 0.55rem",
    borderRadius: "6px",
    border: "1px solid #3a4d67",
    background: "#131f31",
    color: "#d9e5f5",
  },
  actions: {
    display: "flex",
    gap: "0.5rem",
    marginTop: "0.8rem",
  },
  primaryBtn: {
    padding: "0.45rem 0.8rem",
    borderRadius: "6px",
    border: "1px solid #2f5d8a",
    background: "#1b3e63",
    color: "#e3f1ff",
    cursor: "pointer" as const,
  },
  secondaryBtn: {
    padding: "0.45rem 0.8rem",
    borderRadius: "6px",
    border: "1px solid #425774",
    background: "#1a2433",
    color: "#d9e5f5",
    cursor: "pointer" as const,
  },
  helper: {
    marginTop: "0.6rem",
    fontSize: "12px",
    opacity: 0.85,
  },
};
