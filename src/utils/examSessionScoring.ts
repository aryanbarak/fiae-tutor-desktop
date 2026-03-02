export type ExamSessionItem = {
  exercise_id: string;
  task: string;
  input: any;
  answer: string;
  is_correct: boolean;
  attempts: number;
  time_spent_sec: number;
  revealed_solution: boolean;
  points_awarded: number;
  hint_used: boolean;
};

export type ExamSessionTotals = {
  points_total: number;
  points_awarded: number;
  correct_count: number;
  total_time_sec: number;
};

export type ExamSessionState = {
  session_id: string;
  started_at: string;
  items: ExamSessionItem[];
  totals: ExamSessionTotals;
};

export function normalizeAnswer(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

export function scoreAnswer(
  expected: string,
  answer: string,
  revealed: boolean
): { is_correct: boolean; points_awarded: number } {
  const exp = normalizeAnswer(expected);
  const ans = normalizeAnswer(answer);
  const is_correct = exp.length > 0 && ans === exp;
  if (!is_correct) return { is_correct, points_awarded: 0 };
  return { is_correct, points_awarded: revealed ? 0.3 : 1.0 };
}
