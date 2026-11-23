import "server-only";

import { RoleplayStatus, XpSource, type Prisma } from "@/generated/prisma/client";
import { levelForXp, streakAfterCheckIn, type StreakStatus } from "@/lib/gamification";
import { todayISO } from "@/lib/time";
import type { Badge, Quest, QuestType } from "@/lib/types";
import { ensureTodayQuests } from "./quests";

export interface AwardXpInput {
  readonly source: XpSource | keyof typeof XpSource;
  readonly amount: number;
  readonly refId?: string | null;
}

export interface AwardXpResult {
  readonly xp: number;
  readonly level: number;
  readonly leveledUp?: { readonly newLevel: number };
}

export interface BadgeEvaluationCounts {
  readonly scenariosCompleted: number;
  readonly perfectScores: number;
  readonly streakDays: number;
  readonly categoryStars: number;
  readonly bossWins: number;
}

export interface StreakResult {
  readonly currentStreak: number;
  readonly bestStreak: number;
  readonly status: StreakStatus;
}

/**
 * Pure evaluation of a badge rule against aggregated user stats.
 */
export function evaluateBadgeRule(
  ruleType: string,
  ruleValue: number,
  counts: BadgeEvaluationCounts,
): boolean {
  switch (ruleType) {
    case "scenarios_completed":
      return counts.scenariosCompleted >= ruleValue;
    case "perfect_scores":
      return counts.perfectScores >= ruleValue;
    case "streak_days":
      return counts.streakDays >= ruleValue;
    case "category_stars":
      return counts.categoryStars >= ruleValue;
    case "boss_wins":
      return counts.bossWins >= ruleValue;
    case "team_assignments":
      // TODO: evaluate team_assignments when assignments feature is completed
      return false;
    default:
      return false;
  }
}

/**
 * Pure calculation of streak progression for today in Asia/Kolkata.
 */
export function calculateStreak(
  lastActiveIso: string | null,
  todayDateIso: string,
  currentStreak: number,
  bestStreak: number,
): StreakResult {
  const update = streakAfterCheckIn(lastActiveIso, todayDateIso, currentStreak);
  const newBest = Math.max(bestStreak, update.streak);
  return {
    currentStreak: update.streak,
    bestStreak: newBest,
    status: update.status,
  };
}

/**
 * Awards XP, creates an XpEvent, updates user XP and level.
 * When amount <= 0, does nothing and returns current user XP and level.
 */
export async function awardXp(
  tx: Prisma.TransactionClient,
  userId: string,
  input: AwardXpInput,
): Promise<AwardXpResult> {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { xp: true, level: true },
  });

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  if (input.amount <= 0) {
    return { xp: user.xp, level: user.level };
  }

  const beforeLevel = levelForXp(user.xp);
  const newXp = user.xp + input.amount;
  const newLevel = levelForXp(newXp);
  const leveledUp = newLevel > beforeLevel ? { newLevel } : undefined;

  await tx.xpEvent.create({
    data: {
      userId,
      source: input.source as XpSource,
      amount: input.amount,
      refId: input.refId ?? null,
    },
  });

  await tx.user.update({
    where: { id: userId },
    data: {
      xp: newXp,
      level: newLevel,
    },
  });

  return {
    xp: newXp,
    level: newLevel,
    ...(leveledUp ? { leveledUp } : {}),
  };
}

/**
 * Advances the open quest of the given type (capped at target).
 * When a quest completes, its xpReward is awarded with source QUEST.
 * Returns the quests completed by this call.
 */
export async function progressQuests(
  tx: Prisma.TransactionClient,
  userId: string,
  type: QuestType,
  by = 1,
): Promise<Quest[]> {
  const quests = await ensureTodayQuests(tx, userId);
  const targetQuest = quests.find((q) => q.type === type && !q.completed);

  if (!targetQuest) {
    return [];
  }

  const newProgress = Math.min(targetQuest.target, targetQuest.progress + by);
  const isCompleted = newProgress >= targetQuest.target;

  await tx.dailyQuest.update({
    where: { id: targetQuest.id },
    data: {
      progress: newProgress,
      completed: isCompleted,
    },
  });

  const updatedQuest: Quest = {
    ...targetQuest,
    progress: newProgress,
    completed: isCompleted,
  };

  if (isCompleted) {
    if (targetQuest.xpReward > 0) {
      await awardXp(tx, userId, {
        source: XpSource.QUEST,
        amount: targetQuest.xpReward,
        refId: targetQuest.id,
      });
    }
    return [updatedQuest];
  }

  return [];
}

/**
 * Evaluates all badge rules against the user's real counts and awards newly earned badges.
 * Inserts UserBadge rows (skips already earned badges).
 * Returns newly earned badges.
 */
export async function checkBadges(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<Badge[]> {
  const allBadges = await tx.badge.findMany({
    orderBy: { createdAt: "asc" },
  });

  const existingUserBadges = await tx.userBadge.findMany({
    where: { userId },
  });

  const earnedBadgeIds = new Set(existingUserBadges.map((ub) => ub.badgeId));
  const unearned = allBadges.filter((b) => !earnedBadgeIds.has(b.id));

  if (unearned.length === 0) {
    return [];
  }

  // Gather user activity stats to evaluate rules
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { bestStreak: true },
  });

  const [scenariosCompleted, perfectScores, bossWins, attempts, wonSessions] = await Promise.all([
    tx.attempt.count({ where: { userId } }),
    tx.attempt.count({ where: { userId, stars: 3 } }),
    tx.roleplaySession.count({ where: { userId, status: RoleplayStatus.WON } }),
    tx.attempt.findMany({
      where: { userId },
      select: {
        scenarioId: true,
        stars: true,
        scenario: { select: { categoryId: true } },
      },
    }),
    tx.roleplaySession.findMany({
      where: { userId, status: RoleplayStatus.WON, stars: { not: null } },
      select: {
        stars: true,
        persona: { select: { categoryId: true } },
      },
    }),
  ]);

  // Calculate highest stars in any single category
  const scenarioBests = new Map<string, { categoryId: string; stars: number }>();
  for (const a of attempts) {
    const cur = scenarioBests.get(a.scenarioId)?.stars ?? 0;
    if (a.stars > cur) {
      scenarioBests.set(a.scenarioId, { categoryId: a.scenario.categoryId, stars: a.stars });
    }
  }

  const categoryTotals = new Map<string, number>();
  for (const [, val] of scenarioBests) {
    const sum = categoryTotals.get(val.categoryId) ?? 0;
    categoryTotals.set(val.categoryId, sum + val.stars);
  }

  const bossBests = new Map<string, number>();
  for (const ws of wonSessions) {
    const catId = ws.persona.categoryId;
    const cur = bossBests.get(catId) ?? 0;
    if ((ws.stars ?? 0) > cur) {
      bossBests.set(catId, ws.stars ?? 0);
    }
  }

  for (const [catId, stars] of bossBests) {
    const sum = categoryTotals.get(catId) ?? 0;
    categoryTotals.set(catId, sum + stars);
  }

  const categoryStars = categoryTotals.size > 0 ? Math.max(...categoryTotals.values()) : 0;

  const counts: BadgeEvaluationCounts = {
    scenariosCompleted,
    perfectScores,
    streakDays: user?.bestStreak ?? 0,
    categoryStars,
    bossWins,
  };

  const newlyEarned: Badge[] = [];
  const now = new Date();

  for (const badge of unearned) {
    if (evaluateBadgeRule(badge.ruleType, badge.ruleValue, counts)) {
      await tx.userBadge.create({
        data: {
          userId,
          badgeId: badge.id,
          earnedAt: now,
        },
      });

      newlyEarned.push({
        key: badge.key,
        name: badge.name,
        description: badge.description,
        objectKey: badge.objectKey,
        earnedAt: now.toISOString(),
      });
    }
  }

  return newlyEarned;
}

/**
 * Updates the user's overall currentStreak, bestStreak, and lastActiveDate for "active today".
 * Days are calculated in Asia/Kolkata timezone: same day = no change, yesterday = +1, older = reset to 1.
 */
export async function touchStreak(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<StreakResult> {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { currentStreak: true, bestStreak: true, lastActiveDate: true },
  });

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  const todayStr = todayISO();
  const lastActiveIso = user.lastActiveDate ? todayISO(user.lastActiveDate) : null;
  const streakResult = calculateStreak(lastActiveIso, todayStr, user.currentStreak, user.bestStreak);

  await tx.user.update({
    where: { id: userId },
    data: {
      currentStreak: streakResult.currentStreak,
      bestStreak: streakResult.bestStreak,
      lastActiveDate: new Date(),
    },
  });

  return streakResult;
}
