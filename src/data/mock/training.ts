import { levelForXp, replayXp, starsForScore } from "@/lib/gamification";
import type {
  AnswerResult,
  AttemptStart,
  Category,
  CategoryKey,
  GuidedScenario,
  LevelNode,
  ScenarioResult,
  ScenarioSummary,
  StepFeedback,
} from "@/lib/types";
import type { TrainingRepository } from "../repositories";
import { BOSS_PERSONAS, CATEGORY_DEFS } from "./data";
import { delay } from "./delay";
import {
  CHALLENGE_BONUS_XP,
  CHALLENGE_SCENARIO_ID,
  SCENARIOS,
  awardBadges,
  bestStars,
  bumpQuests,
  grantXp,
  nextId,
  starKey,
  state,
  today,
  touchActivity,
  resolveUser,
} from "./state";

export function summaryOf(id: string): ScenarioSummary {
  const s = SCENARIOS[id];
  if (!s) throw new Error(`Unknown scenario ${id}`);
  return {
    id: s.id,
    title: s.title,
    categoryKey: s.categoryKey,
    difficulty: s.difficulty,
    stepCount: s.steps.length,
    xpReward: s.xpReward,
  };
}

export function buildLevelPath(categoryKey: CategoryKey): LevelNode[] {
  const def = CATEGORY_DEFS.find((c) => c.key === categoryKey);
  if (!def) throw new Error(`Unknown category ${categoryKey}`);
  const boss = BOSS_PERSONAS.find((p) => p.categoryKey === categoryKey);
  const nodes: LevelNode[] = [];
  for (let l = 1; l <= 5; l++) {
    const level = l as LevelNode["level"];
    const locked = l > 1 && bestStars(categoryKey, l - 1) === 0;
    const stars = bestStars(categoryKey, l);
    if (l === 5) {
      nodes.push({ level, kind: "boss", title: `Live call: ${boss?.name ?? "Boss"}`, stars, locked, scenarioId: null });
    } else {
      const scenarioId = Object.values(SCENARIOS).find((s) => s.categoryKey === categoryKey && s.level === l)?.id ?? null;
      nodes.push({ level, kind: "guided", title: def.levelTitles[l - 1] ?? `Level ${l}`, stars, locked, scenarioId });
    }
  }
  return nodes;
}

export function buildCategories(): Category[] {
  return CATEGORY_DEFS.map((def) => {
    const nodes = buildLevelPath(def.key);
    const stars = nodes.reduce((sum, n) => sum + n.stars, 0);
    return {
      key: def.key,
      name: def.name,
      colorToken: def.colorToken,
      objectKey: def.objectKey,
      description: def.description,
      progress: {
        completedLevels: nodes.filter((n) => n.stars > 0).length,
        totalLevels: 5,
        stars,
        maxStars: 15,
        mastery: stars / 15,
      },
    };
  });
}

export function challengeCompletedToday(): boolean {
  return state.challengeDoneOn === today();
}

function getAttempt(userId: string, attemptId: string) {
  const attempt = state.attempts.get(attemptId);
  if (!attempt || attempt.userId !== resolveUser(userId)) throw new Error(`Attempt not found: ${attemptId}`);
  return attempt;
}

export const mockTrainingRepo: TrainingRepository = {
  async listCategories() {
    await delay();
    return buildCategories();
  },

  async getLevelPath(_userId, categoryKey) {
    await delay();
    return buildLevelPath(categoryKey);
  },

  async getGuidedScenario(scenarioId): Promise<GuidedScenario> {
    await delay();
    const s = SCENARIOS[scenarioId];
    if (!s) throw new Error(`Unknown scenario ${scenarioId}`);
    return {
      ...summaryOf(scenarioId),
      situation: s.situation,
      customer: s.customer,
      steps: s.steps.map((step) => ({
        id: step.id,
        customerMessage: step.customerMessage,
        choices: step.choices.map((c) => ({ id: c.id, text: c.text })),
      })),
    };
  },

  async startAttempt(userId, scenarioId): Promise<AttemptStart> {
    await delay();
    const s = SCENARIOS[scenarioId];
    const first = s?.steps[0];
    if (!s || !first) throw new Error(`Unknown scenario ${scenarioId}`);
    const id = nextId("attempt");
    state.attempts.set(id, { id, userId: resolveUser(userId), scenarioId, answers: [], result: null });
    return { attemptId: id, scenarioId, firstStepId: first.id };
  },

  async answerStep(userId, attemptId, stepId, choiceId): Promise<AnswerResult> {
    await delay();
    const attempt = getAttempt(userId, attemptId);
    const scenario = SCENARIOS[attempt.scenarioId];
    if (!scenario) throw new Error("Scenario missing");
    const last = attempt.answers[attempt.answers.length - 1];
    const expectedStepId = last ? last.nextStepId : scenario.steps[0]?.id;
    if (!expectedStepId) throw new Error("Attempt already complete");
    if (stepId !== expectedStepId) throw new Error(`Expected step ${expectedStepId}, got ${stepId}`);
    const step = scenario.steps.find((st) => st.id === stepId);
    const choice = step?.choices.find((c) => c.id === choiceId);
    if (!step || !choice) throw new Error("Unknown step or choice");
    attempt.answers.push({ stepId, choiceId, nextStepId: choice.nextStepId });
    return {
      rating: choice.rating,
      points: choice.points,
      maxPoints: Math.max(...step.choices.map((c) => c.points)),
      feedback: choice.feedback,
      nextStepId: choice.nextStepId,
    };
  },

  async finishAttempt(userId, attemptId): Promise<ScenarioResult> {
    await delay();
    const attempt = getAttempt(userId, attemptId);
    if (attempt.result) return attempt.result;
    const scenario = SCENARIOS[attempt.scenarioId];
    if (!scenario) throw new Error("Scenario missing");
    const last = attempt.answers[attempt.answers.length - 1];
    if (!last || last.nextStepId !== null) throw new Error("Attempt is not finished: answer every step first");

    const perStep: StepFeedback[] = attempt.answers.map((a) => {
      const step = scenario.steps.find((st) => st.id === a.stepId)!;
      const choice = step.choices.find((c) => c.id === a.choiceId)!;
      return {
        stepId: step.id,
        customerMessage: step.customerMessage,
        choiceText: choice.text,
        rating: choice.rating,
        points: choice.points,
        feedback: choice.feedback,
      };
    });
    const score = perStep.reduce((sum, p) => sum + p.points, 0);
    const maxScore = attempt.answers.reduce((sum, a) => {
      const step = scenario.steps.find((st) => st.id === a.stepId)!;
      return sum + Math.max(...step.choices.map((c) => c.points));
    }, 0);
    const stars = starsForScore(score, maxScore);
    const key = starKey(scenario.categoryKey, scenario.level);
    const previous = bestStars(scenario.categoryKey, scenario.level);
    let xpEarned = replayXp(previous, stars, scenario.xpReward);

    const isChallenge = scenario.id === CHALLENGE_SCENARIO_ID && !challengeCompletedToday();
    if (isChallenge) {
      xpEarned += CHALLENGE_BONUS_XP;
      state.challengeDoneOn = today();
    }

    state.stars[key] = Math.max(previous, stars) as typeof stars;
    state.counters.scenariosCompleted += 1;
    if (stars === 3) state.counters.perfectScores += 1;
    state.scoreHistory.push({ date: today(), score: Math.round((score / maxScore) * 100) });
    touchActivity();

    const before = levelForXp(state.user.xp);
    grantXp(xpEarned);
    const questsCompleted = [...bumpQuests("scenario"), ...(stars >= 2 ? bumpQuests("stars") : [])];
    const after = levelForXp(state.user.xp);

    const badgeKeys = ["first-steps"];
    if (stars === 3) badgeKeys.push("perfect-score");
    const hcCleared = [1, 2, 3, 4].every((l) => bestStars("handling-complaints", l) > 0);
    if (hcCleared) badgeKeys.push("complaint-crusher");
    const newBadges = awardBadges(badgeKeys);

    const next = Object.values(SCENARIOS).find((s) => s.categoryKey === scenario.categoryKey && s.level === scenario.level + 1);

    const result: ScenarioResult = {
      attemptId,
      scenarioId: scenario.id,
      categoryKey: scenario.categoryKey,
      score,
      maxScore,
      stars,
      bestStars: bestStars(scenario.categoryKey, scenario.level),
      xpEarned,
      perStep,
      ...(after > before ? { leveledUp: { newLevel: after } } : {}),
      newBadges,
      questsCompleted,
      nextScenarioId: next?.id ?? null,
    };
    attempt.result = result;
    return result;
  },
};
