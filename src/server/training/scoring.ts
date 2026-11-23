import { replayXp, starsForScore, type Stars } from "@/lib/gamification";
import type { CategoryKey, Rating } from "@/lib/types";

export interface StepChoice {
  readonly id: string;
  readonly points: number;
  readonly text?: string;
  readonly rating?: Rating;
  readonly feedback?: string;
  readonly nextStepId?: string | null;
}

export interface ScenarioStepData {
  readonly id: string;
  readonly customerMessage?: string;
  readonly choices: readonly StepChoice[];
}

export interface AttemptAnswerData {
  readonly stepId: string;
  readonly choiceId: string;
}

export function computeStepMaxPoints(choices: readonly { readonly points: number }[]): number {
  if (choices.length === 0) return 0;
  return Math.max(...choices.map((c) => c.points));
}

export function computeAttemptScores(
  steps: readonly ScenarioStepData[],
  answers: readonly AttemptAnswerData[],
): { readonly score: number; readonly maxScore: number } {
  let score = 0;
  let maxScore = 0;

  for (const answer of answers) {
    const step = steps.find((s) => s.id === answer.stepId);
    if (!step) continue;

    const choice = step.choices.find((c) => c.id === answer.choiceId);
    if (choice) {
      score += choice.points;
    }
    maxScore += computeStepMaxPoints(step.choices);
  }

  return { score, maxScore };
}

export function computeStars(score: number, maxScore: number): Stars {
  return starsForScore(score, maxScore);
}

export function computeXpAward(previousBestStars: Stars, stars: Stars, baseXp: number): number {
  return replayXp(previousBestStars, stars, baseXp);
}

/**
 * Determines lock status for levels 1 to 5.
 * - Level 1: always unlocked
 * - Level N+1 (levels 2-4): unlocked if Level N has >= 1 star
 * - Level 5 (Boss): unlocked if levels 1 to 4 all have >= 1 star
 */
export function isLevelLocked(
  level: 1 | 2 | 3 | 4 | 5,
  starsPerLevel: Record<number, Stars>,
): boolean {
  if (level === 1) return false;
  if (level <= 4) {
    const prevStars = starsPerLevel[level - 1] ?? 0;
    return prevStars === 0;
  }
  // Level 5 (Boss): Requires levels 1, 2, 3, 4 to each have >= 1 star
  for (let l = 1; l <= 4; l++) {
    if ((starsPerLevel[l] ?? 0) === 0) {
      return true;
    }
  }
  return false;
}

export interface ScenarioRef {
  readonly id: string;
  readonly categoryKey: CategoryKey;
  readonly level: number;
}

export function findNextScenarioId(
  scenarios: readonly ScenarioRef[],
  categoryKey: CategoryKey,
  currentLevel: number,
): string | null {
  const next = scenarios.find(
    (s) => s.categoryKey === categoryKey && s.level === currentLevel + 1,
  );
  return next?.id ?? null;
}
