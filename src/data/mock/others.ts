/** Mock Home, Gamification and Leaderboard repositories. */
import { levelForXp, progressToNextLevel } from "@/lib/gamification";
import type {
  Badge,
  HomeData,
  Leaderboard,
  LeaderboardEntry,
  UserProfile,
  UserSummary,
} from "@/lib/types";
import type { GamificationRepository, HomeRepository, LeaderboardRepository } from "../repositories";
import { BADGE_DEFS, PEOPLE } from "./data";
import { delay } from "./delay";
import { CHALLENGE_BONUS_XP, CHALLENGE_SCENARIO_ID, SCENARIOS, state, resolveUser, identityFor } from "./state";
import { buildCategories, buildLevelPath, challengeCompletedToday, summaryOf } from "./training";
import { toHomeHabits } from "@/lib/habits";
import { mockHabitRepo } from "./habits";

function meSummary(userId?: string): UserSummary {
  const u = state.user;
  const who = identityFor(userId);
  return { id: who.id, name: who.name, avatarKey: who.avatarKey, teamName: u.teamName, level: levelForXp(u.xp), xp: u.xp };
}

function allBadges(): Badge[] {
  return BADGE_DEFS.map((b) => ({ ...b, earnedAt: state.badges.get(b.key) ?? null }));
}

export const mockHomeRepo: HomeRepository = {
  async getHome(userId): Promise<HomeData> {
    await delay();
    const categories = buildCategories();
    const progress = progressToNextLevel(state.user.xp);

    let continueTraining: HomeData["continueTraining"] = null;
    for (const cat of categories) {
      const node = buildLevelPath(cat.key).find((n) => !n.locked && n.stars === 0);
      if (node) {
        continueTraining = { categoryKey: cat.key, categoryName: cat.name, node };
        break;
      }
    }

    const challenge = summaryOf(CHALLENGE_SCENARIO_ID);
    const habits = toHomeHabits(await mockHabitRepo.getOverview(resolveUser(userId)));
    const quests = state.quests;

    return {
      user: meSummary(userId),
      streak: state.user.currentStreak,
      xpToNext: progress.xpToNext,
      xpProgress: progress.fraction,
      challenge: {
        scenario: challenge,
        categoryKey: SCENARIOS[CHALLENGE_SCENARIO_ID]?.categoryKey ?? challenge.categoryKey,
        bonusXp: CHALLENGE_BONUS_XP,
        completedToday: challengeCompletedToday(),
      },
      continueTraining,
      categories,
      habits,
      quests,
    };
  },
};

export const mockGamificationRepo: GamificationRepository = {
  async getProfile(userId?: string): Promise<UserProfile> {
    await delay();
    const u = state.user;
    const progress = progressToNextLevel(u.xp);
    const scores = state.scoreHistory.map((s) => s.score);
    return {
      ...meSummary(userId),
      role: "employee",
      email: u.email,
      currentStreak: u.currentStreak,
      bestStreak: u.bestStreak,
      xpIntoLevel: progress.xpIntoLevel,
      xpForNext: progress.xpForNext,
      xpToNext: progress.xpToNext,
      badges: allBadges().filter((b) => b.earnedAt !== null),
      stats: {
        ...state.counters,
        averageScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        scoreHistory: state.scoreHistory.map((s) => ({ ...s })),
        categoryMastery: buildCategories().map((c) => ({ categoryKey: c.key, mastery: c.progress.mastery })),
      },
    };
  },

  async listBadges() {
    await delay();
    return allBadges();
  },

  async listQuests() {
    await delay();
    return state.quests;
  },
};

export const mockLeaderboardRepo: LeaderboardRepository = {
  async get(userId, scope, period): Promise<Leaderboard> {
    await delay();
    const resolvedId = resolveUser(userId);
    const me = meSummary(userId);
    const pool: { user: UserSummary; xp: number; rankChange: number; isNew?: boolean }[] = [
      ...PEOPLE.filter((p) => p.id !== resolvedId).map((p) => ({
        user: { id: p.id, name: p.name, avatarKey: p.avatarKey, teamName: p.teamName, level: levelForXp(p.xp), xp: p.xp },
        xp: period === "week" ? p.weeklyXp : p.xp,
        rankChange: p.rankChange,
        ...(p.isNew ? { isNew: true } : {}),
      })),
      { user: me, xp: period === "week" ? state.user.weeklyXp : state.user.xp, rankChange: 1 },
    ]
      .filter((e) => scope === "company" || e.user.teamName === me.teamName)
      .sort((a, b) => b.xp - a.xp);

    const entries: LeaderboardEntry[] = pool.map((e, i) => ({ rank: i + 1, ...e }));
    const mine = entries.find((e) => e.user.id === resolvedId);
    if (!mine) throw new Error("Current user missing from leaderboard");
    return { scope, period, entries, me: mine };
  },
};
