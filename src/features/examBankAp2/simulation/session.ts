import { ExamCategory, ExamDifficulty, ExamQuestion, SessionConfig, SessionItemState, SessionResultSummary, SimulationSession } from "./types";
import { shuffleDeterministic } from "./rng";

const STORAGE_KEY = "fiae_exam_bank_ap2_sessions_v1";
const SEED_COUNTER_KEY = "fiae_exam_bank_ap2_seed_counter_v1";
const MAX_HISTORY = 20;

function getDifficultyWeights(preset: SessionConfig["difficultyPreset"]): Record<ExamDifficulty, number> {
  if (preset === "easy_focus") return { easy: 0.6, medium: 0.3, hard: 0.1 };
  if (preset === "medium_focus") return { easy: 0.2, medium: 0.6, hard: 0.2 };
  if (preset === "hard_focus") return { easy: 0.15, medium: 0.35, hard: 0.5 };
  return { easy: 0.4, medium: 0.4, hard: 0.2 };
}

function pickByDifficulty(pool: ExamQuestion[], count: number, seed: number, preset: SessionConfig["difficultyPreset"]): ExamQuestion[] {
  if (preset === "all") {
    return shuffleDeterministic(pool, seed).slice(0, count);
  }

  const shuffled = shuffleDeterministic(pool, seed);
  const buckets: Record<ExamDifficulty, ExamQuestion[]> = { easy: [], medium: [], hard: [] };
  for (const q of shuffled) {
    buckets[q.difficulty].push(q);
  }

  const weights = getDifficultyWeights(preset);
  const targets: Record<ExamDifficulty, number> = {
    easy: Math.floor(count * weights.easy),
    medium: Math.floor(count * weights.medium),
    hard: Math.floor(count * weights.hard),
  };
  let assigned = targets.easy + targets.medium + targets.hard;
  while (assigned < count) {
    if (targets.medium <= targets.easy && targets.medium <= targets.hard) targets.medium += 1;
    else if (targets.easy <= targets.hard) targets.easy += 1;
    else targets.hard += 1;
    assigned += 1;
  }

  const selected: ExamQuestion[] = [];
  const remainders: ExamQuestion[] = [];
  (["easy", "medium", "hard"] as ExamDifficulty[]).forEach((level, idx) => {
    const group = shuffleDeterministic(buckets[level], seed + idx + 101);
    selected.push(...group.slice(0, targets[level]));
    remainders.push(...group.slice(targets[level]));
  });

  if (selected.length < count) {
    const fill = shuffleDeterministic(remainders, seed + 555);
    selected.push(...fill.slice(0, count - selected.length));
  }

  return shuffleDeterministic(selected, seed + 999).slice(0, count);
}

export function selectSessionQuestions(questions: ExamQuestion[], config: SessionConfig): ExamQuestion[] {
  const byCategory = config.category === "all" ? questions : questions.filter((q) => q.category === config.category);
  const cappedCount = Math.min(config.count, byCategory.length);
  return pickByDifficulty(byCategory, cappedCount, config.seed, config.difficultyPreset);
}

export function buildSession(questions: ExamQuestion[], config: SessionConfig): SimulationSession {
  const selected = selectSessionQuestions(questions, config);
  const itemOrder = selected.map((q) => q.id);
  const items: Record<string, SessionItemState> = {};
  for (const q of selected) {
    items[q.id] = {
      qid: q.id,
      category: q.category,
      difficulty: q.difficulty,
      flagged: false,
      timeSpentSec: 0,
      userAnswer: { text: "", isCorrect: null },
    };
  }

  return {
    sessionId: `ap2sim-${config.seed}-${selected.length}-${Date.now()}`,
    createdAt: new Date().toISOString(),
    seed: config.seed,
    durationSec: config.durationMin * 60,
    selection: config,
    itemOrder,
    items,
    startedAtMs: Date.now(),
    elapsedSec: 0,
    currentIndex: 0,
    phase: "running",
  };
}

export function computeSummary(session: SimulationSession): SessionResultSummary {
  let correct = 0;
  let totalTime = 0;
  const breakdownByCategory: Record<string, { total: number; correct: number }> = {};

  for (const qid of session.itemOrder) {
    const item = session.items[qid];
    totalTime += item.timeSpentSec;
    if (!breakdownByCategory[item.category]) {
      breakdownByCategory[item.category] = { total: 0, correct: 0 };
    }
    breakdownByCategory[item.category].total += 1;
    if (item.userAnswer.isCorrect === true) {
      correct += 1;
      breakdownByCategory[item.category].correct += 1;
    }
  }

  const total = session.itemOrder.length;
  const scorePercent = total > 0 ? Math.round((correct / total) * 10000) / 100 : 0;
  const avgTimePerQuestionSec = total > 0 ? Math.round((totalTime / total) * 100) / 100 : 0;

  return { total, correct, scorePercent, avgTimePerQuestionSec, breakdownByCategory };
}

export function loadSessionHistory(): SimulationSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SimulationSession[];
  } catch {
    return [];
  }
}

export function saveSessionHistory(history: SimulationSession[]): void {
  const trimmed = history.slice(0, MAX_HISTORY);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function appendSessionHistory(session: SimulationSession): SimulationSession[] {
  const current = loadSessionHistory();
  const next = [session, ...current];
  saveSessionHistory(next);
  return next.slice(0, MAX_HISTORY);
}

export function nextDeterministicSeed(): number {
  const raw = localStorage.getItem(SEED_COUNTER_KEY);
  const current = raw ? Number(raw) : 0;
  const next = Number.isFinite(current) && current > 0 ? current + 1 : 1;
  localStorage.setItem(SEED_COUNTER_KEY, String(next));
  return 880000 + next;
}

export function categoryLabel(category: ExamCategory): string {
  return category;
}
