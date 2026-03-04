import { TopicId } from "../../../domain/topicRegistry";

export type ExamCategory = string;

export type ExamDifficulty = "easy" | "medium" | "hard";

export type DifficultyPreset = "all" | "balanced" | "easy_focus" | "medium_focus" | "hard_focus";

export type ExamQuestion = {
  id: string;
  category: ExamCategory;
  difficulty: ExamDifficulty;
  question: string;
  answer_short: string;
  answer_long?: string;
  official_question_text?: string;
  official_answer_text?: string;
  keywords: string[];
  traps: string[];
  related_topics?: TopicId[];
};

export type SessionConfig = {
  category: "all" | ExamCategory;
  difficultyPreset: DifficultyPreset;
  durationMin: number;
  count: number;
  seed: number;
};

export type SessionItemState = {
  qid: string;
  category: ExamCategory;
  difficulty: ExamDifficulty;
  flagged: boolean;
  timeSpentSec: number;
  userAnswer: {
    text: string;
    isCorrect: boolean | null;
  };
};

export type SessionResultSummary = {
  total: number;
  correct: number;
  scorePercent: number;
  avgTimePerQuestionSec: number;
  breakdownByCategory: Record<string, { total: number; correct: number }>;
};

export type SimulationSession = {
  sessionId: string;
  createdAt: string;
  completedAt?: string;
  seed: number;
  durationSec: number;
  selection: SessionConfig;
  itemOrder: string[];
  items: Record<string, SessionItemState>;
  startedAtMs: number;
  elapsedSec: number;
  currentIndex: number;
  phase: "running" | "review" | "result";
  summary?: SessionResultSummary;
};
