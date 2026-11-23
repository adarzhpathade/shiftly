import "server-only";

import type { TrainingRepository } from "@/data/repositories";
import { RoleplayStatus, XpSource } from "@/generated/prisma/client";
import { starsForScore, type Stars } from "@/lib/gamification";
import { todayISO } from "@/lib/time";
import type {
  AnswerResult,
  AttemptStart,
  Category,
  CategoryKey,
  ColorToken,
  Difficulty,
  GuidedScenario,
  LevelNode,
  Rating,
  ScenarioResult,
  StepFeedback,
} from "@/lib/types";
import { GUIDED_SCENARIOS } from "../../../prisma/seed/scenarios/content";
import { awardXp, checkBadges, progressQuests, touchStreak } from "@/server/progress";
import { computeXpAward, isLevelLocked } from "./scoring";

export const CHALLENGE_SCENARIO_ID = "sc-hc-3";
export const CHALLENGE_BONUS_XP = 25;

async function getDb() {
  const { db } = await import("@/server/db");
  return db;
}

export const realTrainingRepo: TrainingRepository = {
  async listCategories(userId: string): Promise<readonly Category[]> {
    const db = await getDb();
    const categories = await db.category.findMany({
      orderBy: { order: "asc" },
    });

    const result: Category[] = [];

    for (const cat of categories) {
      const nodes = await realTrainingRepo.getLevelPath(userId, cat.slug as CategoryKey);
      const stars = nodes.reduce((sum, n) => sum + n.stars, 0);

      result.push({
        key: cat.slug as CategoryKey,
        name: cat.name,
        colorToken: cat.colorToken as ColorToken,
        objectKey: cat.objectKey,
        description: cat.description,
        progress: {
          completedLevels: nodes.filter((n) => n.stars > 0).length,
          totalLevels: 5,
          stars,
          maxStars: 15,
          mastery: stars / 15,
        },
      });
    }

    return result;
  },

  async getLevelPath(userId: string, categoryKey: CategoryKey): Promise<readonly LevelNode[]> {
    const db = await getDb();
    const category = await db.category.findUnique({
      where: { slug: categoryKey },
      include: {
        bossPersona: true,
        scenarios: { orderBy: { level: "asc" } },
      },
    });

    if (!category) {
      throw new Error(`Category not found: ${categoryKey}`);
    }

    const [attempts, bossSessions] = await Promise.all([
      db.attempt.findMany({
        where: {
          userId,
          finishedAt: { not: null },
          scenario: { categoryId: category.id },
        },
        select: {
          scenarioId: true,
          stars: true,
          scenario: { select: { level: true } },
        },
      }),
      db.roleplaySession.findMany({
        where: {
          userId,
          persona: { categoryId: category.id },
          status: RoleplayStatus.WON,
          stars: { not: null },
        },
        select: { stars: true },
      }),
    ]);

    const starsPerLevel: Record<number, Stars> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    for (const a of attempts) {
      const lvl = a.scenario.level;
      if (lvl >= 1 && lvl <= 4) {
        starsPerLevel[lvl] = Math.max(starsPerLevel[lvl] ?? 0, a.stars) as Stars;
      }
    }

    for (const bs of bossSessions) {
      starsPerLevel[5] = Math.max(starsPerLevel[5] ?? 0, bs.stars ?? 0) as Stars;
    }

    const nodes: LevelNode[] = [];

    for (let l = 1; l <= 5; l++) {
      const level = l as LevelNode["level"];
      const stars = (starsPerLevel[level] ?? 0) as Stars;
      const locked = isLevelLocked(level, starsPerLevel);

      if (level === 5) {
        nodes.push({
          level,
          kind: "boss",
          title: `Live call: ${category.bossPersona?.name ?? "Boss"}`,
          stars,
          locked,
          scenarioId: null,
        });
      } else {
        const scenario = category.scenarios.find((s) => s.level === level);
        nodes.push({
          level,
          kind: "guided",
          title: scenario?.title ?? `Level ${level}`,
          stars,
          locked,
          scenarioId: scenario?.id ?? null,
        });
      }
    }

    return nodes;
  },

  async getGuidedScenario(scenarioId: string): Promise<GuidedScenario> {
    const db = await getDb();
    const scenario = await db.scenario.findUnique({
      where: { id: scenarioId },
      include: {
        category: true,
        steps: {
          orderBy: { order: "asc" },
          include: {
            choices: {
              orderBy: { id: "asc" },
            },
          },
        },
      },
    });

    if (!scenario) {
      throw new Error(`Unknown scenario ${scenarioId}`);
    }

    const content = GUIDED_SCENARIOS.find((s) => s.id === scenarioId);
    const customer = content?.customer ?? {
      name: "Customer",
      avatarKey: "buddy-1",
    };

    return {
      id: scenario.id,
      title: scenario.title,
      categoryKey: scenario.category.slug as CategoryKey,
      difficulty: scenario.difficulty.toLowerCase() as Difficulty,
      stepCount: scenario.steps.length,
      xpReward: scenario.xpReward,
      situation: scenario.situation,
      customer,
      // Steps and choices without rating, points or feedback
      steps: scenario.steps.map((st) => ({
        id: st.id,
        customerMessage: st.customerMessage,
        choices: st.choices.map((c) => ({
          id: c.id,
          text: c.text,
        })),
      })),
    };
  },

  async startAttempt(userId: string, scenarioId: string): Promise<AttemptStart> {
    const db = await getDb();
    const scenario = await db.scenario.findUnique({
      where: { id: scenarioId },
      include: {
        steps: {
          orderBy: { order: "asc" },
          take: 1,
        },
      },
    });

    if (!scenario) {
      throw new Error(`Unknown scenario ${scenarioId}`);
    }

    const firstStep = scenario.steps[0];
    if (!firstStep) {
      throw new Error(`Scenario has no steps: ${scenarioId}`);
    }

    const attempt = await db.attempt.create({
      data: {
        userId,
        scenarioId,
        score: 0,
        stars: 0,
        xpEarned: 0,
        finishedAt: null,
      },
    });

    return {
      attemptId: attempt.id,
      scenarioId,
      firstStepId: firstStep.id,
    };
  },

  async answerStep(
    userId: string,
    attemptId: string,
    stepId: string,
    choiceId: string,
  ): Promise<AnswerResult> {
    const db = await getDb();
    const attempt = await db.attempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: {
          orderBy: { id: "asc" },
        },
        scenario: {
          include: {
            steps: {
              orderBy: { order: "asc" },
              include: { choices: true },
            },
          },
        },
      },
    });

    if (!attempt || attempt.userId !== userId) {
      throw new Error(`Attempt not found: ${attemptId}`);
    }

    if (attempt.finishedAt !== null) {
      throw new Error("Attempt is already complete");
    }

    if (attempt.answers.some((a) => a.stepId === stepId)) {
      throw new Error("Step already answered");
    }

    const scenario = attempt.scenario;
    const firstStepId = scenario.steps[0]?.id;

    let expectedStepId: string | null | undefined = firstStepId;
    if (attempt.answers.length > 0) {
      const lastAnswer = attempt.answers[attempt.answers.length - 1]!;
      const lastStep = scenario.steps.find((s) => s.id === lastAnswer.stepId);
      const lastChoice = lastStep?.choices.find((c) => c.id === lastAnswer.choiceId);
      expectedStepId = lastChoice?.nextStepId ?? null;
    }

    if (!expectedStepId) {
      throw new Error("Attempt already complete");
    }

    if (stepId !== expectedStepId) {
      throw new Error(`Expected step ${expectedStepId}, got ${stepId}`);
    }

    const step = scenario.steps.find((st) => st.id === stepId);
    const choice = step?.choices.find((c) => c.id === choiceId);

    if (!step || !choice) {
      throw new Error("Unknown step or choice");
    }

    await db.attemptAnswer.create({
      data: {
        attemptId,
        stepId,
        choiceId,
      },
    });

    const maxPoints = Math.max(...step.choices.map((c) => c.points));

    return {
      rating: choice.rating.toLowerCase() as Rating,
      points: choice.points,
      maxPoints,
      feedback: choice.feedback,
      nextStepId: choice.nextStepId,
    };
  },

  async finishAttempt(userId: string, attemptId: string): Promise<ScenarioResult> {
    const db = await getDb();
    const attempt = await db.attempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: {
          include: {
            step: true,
            choice: true,
          },
        },
        scenario: {
          include: {
            category: true,
            steps: {
              include: { choices: true },
            },
          },
        },
      },
    });

    if (!attempt || attempt.userId !== userId) {
      throw new Error(`Attempt not found: ${attemptId}`);
    }

    if (attempt.finishedAt) {
      throw new Error("Attempt is already finished");
    }

    const scenario = attempt.scenario;

    if (attempt.answers.length === 0) {
      throw new Error("Attempt is not finished: answer every step first");
    }

    const lastAnswer = attempt.answers[attempt.answers.length - 1]!;
    if (lastAnswer.choice.nextStepId !== null) {
      throw new Error("Attempt is not finished: answer every step first");
    }

    const perStep: StepFeedback[] = attempt.answers.map((a) => ({
      stepId: a.stepId,
      customerMessage: a.step.customerMessage,
      choiceText: a.choice.text,
      rating: a.choice.rating.toLowerCase() as Rating,
      points: a.choice.points,
      feedback: a.choice.feedback,
    }));

    const score = perStep.reduce((sum, p) => sum + p.points, 0);
    const maxScore = attempt.answers.reduce((sum, a) => {
      const step = scenario.steps.find((st) => st.id === a.stepId)!;
      return sum + Math.max(...step.choices.map((c) => c.points));
    }, 0);

    const stars = starsForScore(score, maxScore);

    // Find previous best stars for this scenario
    const prevBest = await db.attempt.findFirst({
      where: {
        userId,
        scenarioId: attempt.scenarioId,
        finishedAt: { not: null },
        id: { not: attemptId },
      },
      orderBy: { stars: "desc" },
      select: { stars: true },
    });

    const previousBestStars = (prevBest?.stars ?? 0) as Stars;
    let xpEarned = computeXpAward(previousBestStars, stars, scenario.xpReward);

    // Today's Challenge check
    if (attempt.scenarioId === CHALLENGE_SCENARIO_ID) {
      const todayStart = new Date(`${todayISO()}T00:00:00.000Z`);
      const existingToday = await db.attempt.findFirst({
        where: {
          userId,
          scenarioId: CHALLENGE_SCENARIO_ID,
          finishedAt: { gte: todayStart },
          id: { not: attemptId },
        },
      });
      if (!existingToday) {
        xpEarned += CHALLENGE_BONUS_XP;
      }
    }

    const { awardResult, questsCompleted, newBadges } = await db.$transaction(async (tx) => {
      // Only an unfinished attempt can be finished: a second finish (double tap, retry) pays nothing.
      const finished = await tx.attempt.updateMany({
        where: { id: attemptId, finishedAt: null },
        data: {
          score,
          stars,
          xpEarned,
          finishedAt: new Date(),
        },
      });
      if (finished.count === 0) {
        throw new Error("Attempt is already finished");
      }

      const awardResult = await awardXp(tx, userId, {
        source: XpSource.SCENARIO,
        amount: xpEarned,
        refId: attemptId,
      });

      const qScenario = await progressQuests(tx, userId, "scenario", 1);
      const qStars = stars >= 2 ? await progressQuests(tx, userId, "stars", 1) : [];
      const questsCompleted = [...qScenario, ...qStars];

      const newBadges = await checkBadges(tx, userId);
      await touchStreak(tx, userId);

      return { awardResult, questsCompleted, newBadges };
    });

    const nextScenario = await db.scenario.findFirst({
      where: {
        categoryId: scenario.categoryId,
        level: scenario.level + 1,
      },
      select: { id: true },
    });

    return {
      attemptId,
      scenarioId: scenario.id,
      categoryKey: scenario.category.slug as CategoryKey,
      score,
      maxScore,
      stars,
      bestStars: Math.max(previousBestStars, stars) as Stars,
      xpEarned,
      perStep,
      ...(awardResult.leveledUp ? { leveledUp: awardResult.leveledUp } : {}),
      newBadges,
      questsCompleted,
      nextScenarioId: nextScenario?.id ?? null,
    };
  },
};
