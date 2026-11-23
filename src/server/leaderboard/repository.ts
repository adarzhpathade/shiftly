import "server-only";

import type { Leaderboard, LeaderboardEntry, LeaderboardPeriod, LeaderboardScope } from "@/lib/types";
import type { LeaderboardRepository } from "@/data/repositories";
import { levelForXp } from "@/lib/gamification";
import { Role } from "@/generated/prisma/client";
import {
  assembleLeaderboard,
  buildLeaderboardEntries,
  getStartOfDayIST,
  getStartOfWeekIST,
  isMondayIST,
  rankItems,
  type CandidateItem,
} from "./ranking";

async function getDb() {
  if (!process.env.DATABASE_URL) {
    try {
      const dotenv = await import("dotenv");
      dotenv.config();
    } catch {
      // Ignore if dotenv cannot be loaded
    }
  }
  const { db } = await import("@/server/db");
  return db;
}

export const realLeaderboardRepo: LeaderboardRepository = {
  async get(userId: string, scope: LeaderboardScope, period: LeaderboardPeriod): Promise<Leaderboard> {
    const db = await getDb();

    // 1. Look up the viewer (an unknown id gets an empty board, never someone else's)
    const viewer = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        teamId: true,
      },
    });

    if (!viewer) {
      return {
        scope,
        period,
        entries: [],
        me: null as unknown as LeaderboardEntry,
      };
    }

    // 2. Select candidates according to scope
    // scope team: only employees in viewer's team (managers and admins are not ranked)
    // scope company: all users with role EMPLOYEE (managers and admins are not ranked)
    let users: Array<{
      id: string;
      name: string;
      avatarKey: string;
      role: Role;
      teamId: string | null;
      xp: number;
      level: number;
      createdAt: Date;
      team: { name: string } | null;
    }> = [];

    if (scope === "team") {
      if (viewer.teamId) {
        users = await db.user.findMany({
          where: { teamId: viewer.teamId, role: Role.EMPLOYEE },
          select: {
            id: true,
            name: true,
            avatarKey: true,
            role: true,
            teamId: true,
            xp: true,
            level: true,
            createdAt: true,
            team: { select: { name: true } },
          },
        });
      }
    } else {
      // Company scope: only EMPLOYEE role
      users = await db.user.findMany({
        where: { role: Role.EMPLOYEE },
        select: {
          id: true,
          name: true,
          avatarKey: true,
          role: true,
          teamId: true,
          xp: true,
          level: true,
          createdAt: true,
          team: { select: { name: true } },
        },
      });
    }

    if (users.length === 0) {
      return {
        scope,
        period,
        entries: [],
        me: null as unknown as LeaderboardEntry,
      };
    }

    const candidateIds = users.map((u) => u.id);
    const now = new Date();
    const startOfWeekIST = getStartOfWeekIST(now);
    const startOfTodayIST = getStartOfDayIST(now);
    const isMonday = isMondayIST(now);

    // 3. Compute period XP for each candidate
    // period week: sum of XpEvent.amount since Monday 00:00 Asia/Kolkata
    // period all: User.xp
    const currentXpMap = new Map<string, number>();

    if (period === "all") {
      for (const u of users) {
        currentXpMap.set(u.id, u.xp);
      }
    } else {
      const weeklyEvents = await db.xpEvent.groupBy({
        by: ["userId"],
        where: {
          userId: { in: candidateIds },
          createdAt: { gte: startOfWeekIST },
        },
        _sum: {
          amount: true,
        },
      });

      for (const row of weeklyEvents) {
        currentXpMap.set(row.userId, row._sum.amount ?? 0);
      }
    }

    // 4. Compute yesterday's XP for rank change calculation
    // Yesterday's ranking considers only users who existed as of end of yesterday
    const usersExistedYesterday = users.filter((u) => u.createdAt.getTime() < startOfTodayIST.getTime());
    let yesterdayRankMap: Map<string, number> | null = null;

    if (period === "all") {
      // XP yesterday = current User.xp minus any XP earned today (createdAt >= startOfTodayIST)
      const todayEvents = await db.xpEvent.groupBy({
        by: ["userId"],
        where: {
          userId: { in: candidateIds },
          createdAt: { gte: startOfTodayIST },
        },
        _sum: {
          amount: true,
        },
      });

      const todayAmountMap = new Map<string, number>();
      for (const row of todayEvents) {
        todayAmountMap.set(row.userId, row._sum.amount ?? 0);
      }

      const yesterdayItems: CandidateItem[] = usersExistedYesterday.map((u) => ({
        id: u.id,
        name: u.name,
        xp: Math.max(0, u.xp - (todayAmountMap.get(u.id) ?? 0)),
      }));

      const rankedYesterday = rankItems(yesterdayItems);
      yesterdayRankMap = new Map(rankedYesterday.map((r) => [r.id, r.rank]));
    } else {
      // Period week: if today is Monday, the week just began today, so there is no yesterday rank in this week
      if (!isMonday) {
        const yesterdayWeeklyEvents = await db.xpEvent.groupBy({
          by: ["userId"],
          where: {
            userId: { in: candidateIds },
            createdAt: {
              gte: startOfWeekIST,
              lt: startOfTodayIST,
            },
          },
          _sum: {
            amount: true,
          },
        });

        const yesterdayWeeklyMap = new Map<string, number>();
        for (const row of yesterdayWeeklyEvents) {
          yesterdayWeeklyMap.set(row.userId, row._sum.amount ?? 0);
        }

        const yesterdayItems: CandidateItem[] = usersExistedYesterday.map((u) => ({
          id: u.id,
          name: u.name,
          xp: yesterdayWeeklyMap.get(u.id) ?? 0,
        }));

        const rankedYesterday = rankItems(yesterdayItems);
        yesterdayRankMap = new Map(rankedYesterday.map((r) => [r.id, r.rank]));
      }
    }

    // 5. Rank current candidates
    const currentCandidates: CandidateItem[] = users.map((u) => ({
      id: u.id,
      name: u.name,
      xp: currentXpMap.get(u.id) ?? 0,
      user: {
        id: u.id,
        name: u.name,
        avatarKey: u.avatarKey,
        teamName: u.team?.name ?? "No Team",
        level: levelForXp(u.xp),
        xp: u.xp,
        createdAt: u.createdAt,
      },
    }));

    const rankedCurrent = rankItems(currentCandidates);

    // 6. Assemble entries and final leaderboard
    const allEntries = buildLeaderboardEntries(rankedCurrent, yesterdayRankMap, startOfTodayIST);
    return assembleLeaderboard(scope, period, allEntries, viewer.id);
  },
};
