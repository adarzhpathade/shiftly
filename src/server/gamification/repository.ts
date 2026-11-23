import "server-only";

import type { GamificationRepository } from "@/data/repositories";
import { levelForXp, progressToNextLevel } from "@/lib/gamification";
import type { Badge, Quest, Role, UserProfile } from "@/lib/types";
import { ensureTodayQuests } from "@/server/progress/quests";
import { getUserStats } from "@/server/progress/stats";

async function getDb() {
  const { db } = await import("@/server/db");
  return db;
}

export const realGamificationRepo: GamificationRepository = {
  async getProfile(userId: string): Promise<UserProfile> {
    const db = await getDb();
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { team: true },
    });

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    const progress = progressToNextLevel(user.xp);
    const allBadges = await realGamificationRepo.listBadges(userId);
    const earnedBadges = allBadges.filter((b) => b.earnedAt !== null);
    const stats = await getUserStats(db, userId);

    return {
      id: user.id,
      name: user.name,
      role: user.role.toLowerCase() as Role,
      email: user.email,
      avatarKey: user.avatarKey,
      teamName: user.team?.name ?? "General",
      level: levelForXp(user.xp),
      xp: user.xp,
      currentStreak: user.currentStreak,
      bestStreak: user.bestStreak,
      xpIntoLevel: progress.xpIntoLevel,
      xpForNext: progress.xpForNext,
      xpToNext: progress.xpToNext,
      badges: earnedBadges,
      stats,
    };
  },

  async listBadges(userId: string): Promise<readonly Badge[]> {
    const db = await getDb();
    const [badges, userBadges] = await Promise.all([
      db.badge.findMany({
        orderBy: { createdAt: "asc" },
      }),
      db.userBadge.findMany({
        where: { userId },
      }),
    ]);

    const earnedMap = new Map<string, string>();
    for (const ub of userBadges) {
      earnedMap.set(ub.badgeId, ub.earnedAt.toISOString());
    }

    return badges.map((b) => ({
      key: b.key,
      name: b.name,
      description: b.description,
      objectKey: b.objectKey,
      earnedAt: earnedMap.get(b.id) ?? null,
    }));
  },

  async listQuests(userId: string): Promise<readonly Quest[]> {
    const db = await getDb();
    return await db.$transaction(async (tx) => {
      return await ensureTodayQuests(tx, userId);
    });
  },
};
