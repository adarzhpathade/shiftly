import "server-only";

import { habitRepo, gamificationRepo } from "@/data";
import type { HomeRepository } from "@/data/repositories";
import { levelForXp, progressToNextLevel } from "@/lib/gamification";
import { todayISO } from "@/lib/time";
import type { HomeData, ScenarioSummary, UserSummary } from "@/lib/types";
import {
  CHALLENGE_BONUS_XP,
  CHALLENGE_SCENARIO_ID,
  realTrainingRepo,
} from "@/server/training/repository";

async function getDb() {
  const { db } = await import("@/server/db");
  return db;
}

export const realHomeRepo: HomeRepository = {
  async getHome(userId: string): Promise<HomeData> {
    const db = await getDb();
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { team: true },
    });

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    const userSummary: UserSummary = {
      id: user.id,
      name: user.name,
      avatarKey: user.avatarKey,
      teamName: user.team?.name ?? "General",
      level: levelForXp(user.xp),
      xp: user.xp,
    };

    const progress = progressToNextLevel(user.xp);
    const categories = await realTrainingRepo.listCategories(userId);

    let continueTraining: HomeData["continueTraining"] = null;
    for (const cat of categories) {
      const nodes = await realTrainingRepo.getLevelPath(userId, cat.key);
      const node = nodes.find((n) => !n.locked && n.stars === 0);
      if (node) {
        continueTraining = { categoryKey: cat.key, categoryName: cat.name, node };
        break;
      }
    }

    const challengeScenario = await realTrainingRepo.getGuidedScenario(CHALLENGE_SCENARIO_ID);
    const challengeSummary: ScenarioSummary = {
      id: challengeScenario.id,
      title: challengeScenario.title,
      categoryKey: challengeScenario.categoryKey,
      difficulty: challengeScenario.difficulty,
      stepCount: challengeScenario.stepCount,
      xpReward: challengeScenario.xpReward,
    };

    const todayStart = new Date(`${todayISO()}T00:00:00.000Z`);
    const challengeDone = await db.attempt.findFirst({
      where: {
        userId,
        scenarioId: CHALLENGE_SCENARIO_ID,
        finishedAt: { gte: todayStart },
      },
    });

    const [todaysHabits, quests] = await Promise.all([
      habitRepo.listToday(userId),
      gamificationRepo.listQuests(userId),
    ]);

    return {
      user: userSummary,
      streak: user.currentStreak,
      xpToNext: progress.xpToNext,
      xpProgress: progress.fraction,
      challenge: {
        scenario: challengeSummary,
        categoryKey: challengeSummary.categoryKey,
        bonusXp: CHALLENGE_BONUS_XP,
        completedToday: Boolean(challengeDone),
      },
      continueTraining,
      categories,
      todaysHabits,
      quests,
    };
  },
};
