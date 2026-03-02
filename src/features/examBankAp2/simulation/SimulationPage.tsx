import { useEffect, useMemo, useState } from "react";
import { ResultView } from "./ResultView";
import { ReviewView } from "./ReviewView";
import { RunningView } from "./RunningView";
import { SessionHistory } from "./SessionHistory";
import { SetupForm } from "./SetupForm";
import {
  appendSessionHistory,
  buildSession,
  computeSummary,
  loadSessionHistory,
  nextDeterministicSeed,
  selectSessionQuestions,
} from "./session";
import { ExamQuestion, SessionConfig, SimulationSession } from "./types";

const DEFAULT_CONFIG: SessionConfig = {
  category: "all",
  difficultyPreset: "all",
  durationMin: 30,
  count: 20,
  seed: 880001,
};

type SimulationPageProps = {
  questions: ExamQuestion[];
  replaySession?: SimulationSession | null;
  onReplayConsumed?: () => void;
  showHistoryOnly?: boolean;
  onReplayFromHistory?: (session: SimulationSession) => void;
};

export function SimulationPage({
  questions,
  replaySession = null,
  onReplayConsumed,
  showHistoryOnly = false,
  onReplayFromHistory,
}: SimulationPageProps) {
  const [config, setConfig] = useState<SessionConfig>(DEFAULT_CONFIG);
  const [session, setSession] = useState<SimulationSession | null>(null);
  const [history, setHistory] = useState<SimulationSession[]>([]);
  const [lastTickMs, setLastTickMs] = useState<number | null>(null);

  useEffect(() => {
    setHistory(loadSessionHistory());
  }, []);

  useEffect(() => {
    if (!replaySession) return;
    setSession(replaySession);
    setConfig(replaySession.selection);
    setLastTickMs(null);
    onReplayConsumed?.();
  }, [onReplayConsumed, replaySession]);

  useEffect(() => {
    if (!session || session.phase !== "running") return;
    const handle = window.setInterval(() => {
      setSession((current) => {
        if (!current || current.phase !== "running") return current;
        const now = Date.now();
        const baseMs = lastTickMs ?? now;
        const deltaSec = Math.max(0, Math.floor((now - baseMs) / 1000));
        if (deltaSec <= 0) return current;
        const qid = current.itemOrder[current.currentIndex];
        if (!qid) return current;
        const nextItem = {
          ...current.items[qid],
          timeSpentSec: current.items[qid].timeSpentSec + deltaSec,
        };
        const elapsedSec = current.elapsedSec + deltaSec;
        const next: SimulationSession = {
          ...current,
          elapsedSec,
          items: { ...current.items, [qid]: nextItem },
        };
        if (elapsedSec >= current.durationSec) {
          return { ...next, phase: "review", completedAt: new Date().toISOString() };
        }
        return next;
      });
      setLastTickMs(Date.now());
    }, 1000);
    return () => window.clearInterval(handle);
  }, [lastTickMs, session]);

  const availableCount = useMemo(() => selectSessionQuestions(questions, config).length, [config, questions]);

  const currentQuestion = useMemo(() => {
    if (!session) return null;
    const qid = session.itemOrder[session.currentIndex];
    return questions.find((q) => q.id === qid) ?? null;
  }, [questions, session]);

  const startSession = () => {
    const built = buildSession(questions, config);
    setSession(built);
    setLastTickMs(Date.now());
  };

  const updateCurrentItem = (updater: (sessionItem: SimulationSession["items"][string]) => SimulationSession["items"][string]) => {
    setSession((current) => {
      if (!current) return current;
      const qid = current.itemOrder[current.currentIndex];
      if (!qid) return current;
      return {
        ...current,
        items: {
          ...current.items,
          [qid]: updater(current.items[qid]),
        },
      };
    });
  };

  const moveIndex = (delta: number) => {
    setSession((current) => {
      if (!current) return current;
      const nextIdx = Math.max(0, Math.min(current.itemOrder.length - 1, current.currentIndex + delta));
      return { ...current, currentIndex: nextIdx };
    });
    setLastTickMs(Date.now());
  };

  const jumpTo = (idx: number) => {
    setSession((current) => {
      if (!current) return current;
      const nextIdx = Math.max(0, Math.min(current.itemOrder.length - 1, idx));
      return { ...current, currentIndex: nextIdx };
    });
    setLastTickMs(Date.now());
  };

  const finishRunning = () => {
    setSession((current) => {
      if (!current) return current;
      return { ...current, phase: "review", completedAt: new Date().toISOString() };
    });
    setLastTickMs(null);
  };

  const finalizeResult = () => {
    setSession((current) => {
      if (!current) return current;
      const summary = computeSummary(current);
      const done: SimulationSession = {
        ...current,
        phase: "result",
        summary,
        completedAt: current.completedAt ?? new Date().toISOString(),
      };
      const nextHistory = appendSessionHistory(done);
      setHistory(nextHistory);
      return done;
    });
  };

  const resetToSetup = () => {
    setSession(null);
    setLastTickMs(null);
  };

  const handleReplayHistory = (historySession: SimulationSession) => {
    setSession(historySession);
    setLastTickMs(null);
    onReplayFromHistory?.(historySession);
  };

  if (showHistoryOnly) {
    return <SessionHistory sessions={history} onReplay={handleReplayHistory} />;
  }

  if (!session) {
    return (
      <SetupForm
        config={config}
        onConfigChange={setConfig}
        onStart={startSession}
        onAutoSeed={() => setConfig((prev) => ({ ...prev, seed: nextDeterministicSeed() }))}
        availableCount={availableCount}
      />
    );
  }

  if (session.phase === "running") {
    return (
      <RunningView
        session={session}
        question={currentQuestion}
        remainingSec={Math.max(0, session.durationSec - session.elapsedSec)}
        onPrev={() => moveIndex(-1)}
        onNext={() => moveIndex(1)}
        onJump={jumpTo}
        onToggleFlag={() => updateCurrentItem((item) => ({ ...item, flagged: !item.flagged }))}
        onFinish={finishRunning}
        onAnswerTextChange={(text) => updateCurrentItem((item) => ({ ...item, userAnswer: { ...item.userAnswer, text } }))}
      />
    );
  }

  if (session.phase === "review") {
    return (
      <ReviewView
        session={session}
        question={currentQuestion}
        onPrev={() => moveIndex(-1)}
        onNext={() => moveIndex(1)}
        onJump={jumpTo}
        onMarkCorrect={(value) =>
          updateCurrentItem((item) => ({ ...item, userAnswer: { ...item.userAnswer, isCorrect: value } }))
        }
        onFinalize={finalizeResult}
      />
    );
  }

  return (
    <ResultView
      session={session}
      onReplayCurrent={() => setSession((current) => (current ? { ...current, phase: "review" } : current))}
      onBackToSetup={resetToSetup}
    />
  );
}
