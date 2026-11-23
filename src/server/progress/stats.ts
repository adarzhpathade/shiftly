import "server-only";

import { RoleplayStatus, type PrismaClient, type Prisma } from "@/generated/prisma/client";
import { todayISO } from "@/lib/time";
import type { CategoryKey, UserStats } from "@/lib/types";

export const CATEGORY_KEYS: readonly CategoryKey[] = [
  "handling-complaints",
  "customer-queries",
  "difficult-customers",
  "problem-solving",
] as const;

export function computeAverageScore(scores: readonly number[]): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((acc, score) => acc + score, 0);
  return Math.round(sum / scores.length);
}

export interface MasteryInputData {
  readonly guidedStars: Record<string, number>; // scenarioId -> best stars
  readonly bossStars: Record<string, number>; // categorySlug -> best stars
  readonly scenarioCategories: Record<string, string>; // scenarioId -> categorySlug
}

export function computeCategoryMastery(
  data: MasteryInputData,
): readonly { readonly categoryKey: CategoryKey; readonly mastery: number }[] {
  return CATEGORY_KEYS.map((key) => {
    let guidedTotal = 0;
    for (const [scenarioId, stars] of Object.entries(data.guidedStars)) {
      if (data.scenarioCategories[scenarioId] === key) {
        guidedTotal += stars;
      }
    }
    const bossTotal = data.bossStars[key] ?? 0;
    const totalStars = guidedTotal + bossTotal;
    const mastery = Math.min(1, Math.max(0, totalStars / 15));
    return {
      categoryKey: key,
      mastery,
    };
  });
}

/**
 * Computes full user statistics from real database tables.
 */
export async function getUserStats(
  db: PrismaClient | Prisma.TransactionClient,
  userId: string,
): Promise<UserStats> {
  const [scenariosCompleted, perfectScores, habitCheckIns, bossWins, attempts, wonSessions] =
    await Promise.all([
      db.attempt.count({ where: { userId } }),
      db.attempt.count({ where: { userId, stars: 3 } }),
      db.habitLog.count({ where: { habit: { userId } } }),
      db.roleplaySession.count({ where: { userId, status: RoleplayStatus.WON } }),
      db.attempt.findMany({
        where: { userId },
        select: {
          score: true,
          stars: true,
          completedAt: true,
          scenarioId: true,
          scenario: {
            select: {
              category: { select: { slug: true } },
            },
          },
        },
        orderBy: { completedAt: "asc" },
      }),
      db.roleplaySession.findMany({
        where: {
          userId,
          status: RoleplayStatus.WON,
          stars: { not: null },
        },
        select: {
          stars: true,
          persona: {
            select: {
              category: { select: { slug: true } },
            },
          },
        },
      }),
    ]);

  const scores = attempts.map((a) => a.score);
  const averageScore = computeAverageScore(scores);

  const scoreHistory = attempts.map((a) => ({
    date: todayISO(a.completedAt),
    score: a.score,
  }));

  const guidedStars: Record<string, number> = {};
  const scenarioCategories: Record<string, string> = {};
  for (const a of attempts) {
    const cur = guidedStars[a.scenarioId] ?? 0;
    if (a.stars > cur) {
      guidedStars[a.scenarioId] = a.stars;
    }
    if (a.scenario?.category?.slug) {
      scenarioCategories[a.scenarioId] = a.scenario.category.slug;
    }
  }

  const bossStars: Record<string, number> = {};
  for (const s of wonSessions) {
    const slug = s.persona?.category?.slug;
    if (slug) {
      const cur = bossStars[slug] ?? 0;
      if ((s.stars ?? 0) > cur) {
        bossStars[slug] = s.stars ?? 0;
      }
    }
  }

  const categoryMastery = computeCategoryMastery({
    guidedStars,
    bossStars,
    scenarioCategories,
  });

  return {
    scenariosCompleted,
    perfectScores,
    habitCheckIns,
    bossWins,
    averageScore,
    scoreHistory,
    categoryMastery,
  };
}
