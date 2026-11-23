import type { Leaderboard, LeaderboardEntry, LeaderboardPeriod, LeaderboardScope, UserSummary } from "@/lib/types";

export const APP_TIMEZONE = "Asia/Kolkata";
// Asia/Kolkata is UTC+5:30 with no daylight saving time (DST).
export const IST_OFFSET_MS = 19_800_000; // (5 * 60 + 30) * 60 * 1000
export const DAY_MS = 86_400_000;
export const LEADERBOARD_PAGE_SIZE = 50;

/**
 * Returns the Date representing Monday 00:00:00.000 Asia/Kolkata of the current week
 * corresponding to `now`.
 */
export function getStartOfWeekIST(now: Date = new Date()): Date {
  const istTime = now.getTime() + IST_OFFSET_MS;
  const istDate = new Date(istTime);
  const day = istDate.getUTCDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const daysSinceMonday = (day + 6) % 7;
  const msIntoDay =
    ((istDate.getUTCHours() * 60 + istDate.getUTCMinutes()) * 60 + istDate.getUTCSeconds()) * 1000 +
    istDate.getUTCMilliseconds();

  const startOfWeekMs = now.getTime() - (daysSinceMonday * DAY_MS + msIntoDay);
  return new Date(startOfWeekMs);
}

/**
 * Returns the Date representing 00:00:00.000 Asia/Kolkata of the current day
 * corresponding to `now`.
 */
export function getStartOfDayIST(now: Date = new Date()): Date {
  const istTime = now.getTime() + IST_OFFSET_MS;
  const istDate = new Date(istTime);
  const msIntoDay =
    ((istDate.getUTCHours() * 60 + istDate.getUTCMinutes()) * 60 + istDate.getUTCSeconds()) * 1000 +
    istDate.getUTCMilliseconds();

  const startOfDayMs = now.getTime() - msIntoDay;
  return new Date(startOfDayMs);
}

/**
 * Returns whether `now` is Monday in Asia/Kolkata.
 */
export function isMondayIST(now: Date = new Date()): boolean {
  const istTime = now.getTime() + IST_OFFSET_MS;
  const istDate = new Date(istTime);
  return istDate.getUTCDay() === 1;
}

export interface RankableUser {
  readonly id: string;
  readonly name: string;
  readonly avatarKey: string;
  readonly teamName: string;
  readonly level: number;
  readonly xp: number; // total all-time XP for UserSummary
  readonly createdAt: Date;
}

export interface CandidateItem {
  readonly id: string;
  readonly name: string;
  readonly xp: number; // XP in the evaluated period (weekly or all-time)
  readonly user?: RankableUser;
}

export interface RankedItem<T extends CandidateItem = CandidateItem> {
  readonly item: T;
  readonly rank: number;
}

/**
 * Sorts items by:
 * 1. XP descending
 * 2. Name ascending (alphabetical tie-breaker)
 * 3. ID ascending (stable fallback)
 *
 * Assigns ranks using standard competition ranking (1, 1, 3, …),
 * where equal XP shares the same rank.
 */
export function rankItems<T extends CandidateItem>(items: readonly T[]): Array<T & { rank: number }> {
  if (items.length === 0) return [];

  const sorted = [...items].sort((a, b) => {
    if (b.xp !== a.xp) return b.xp - a.xp;
    const nameCmp = a.name.localeCompare(b.name);
    if (nameCmp !== 0) return nameCmp;
    return a.id.localeCompare(b.id);
  });

  let currentRank = 1;
  return sorted.map((entry, index) => {
    if (index > 0 && entry.xp < sorted[index - 1]!.xp) {
      currentRank = index + 1;
    }
    return {
      ...entry,
      rank: currentRank,
    };
  });
}

export interface RankChangeResult {
  readonly rankChange: number;
  readonly isNew?: boolean;
}

/**
 * Calculates rank change:
 * rank now minus rank as of the end of yesterday (same scope and period),
 * where positive = moved up (e.g. yesterday rank 5 -> today rank 3 => +2).
 * 0 for new users or when yesterday rank is not available (e.g. Monday week reset).
 */
export function computeRankChange(
  currentRank: number,
  yesterdayRank: number | null | undefined,
  isCreatedToday: boolean,
): RankChangeResult {
  if (isCreatedToday || yesterdayRank === null || yesterdayRank === undefined) {
    return {
      rankChange: 0,
      ...(isCreatedToday ? { isNew: true } : {}),
    };
  }
  return {
    rankChange: yesterdayRank - currentRank,
  };
}

/**
 * Builds LeaderboardEntry array from ranked items with rank changes.
 */
export function buildLeaderboardEntries(
  rankedItems: readonly (CandidateItem & { rank: number })[],
  yesterdayRankMap: Map<string, number> | null,
  startOfTodayIST: Date,
): LeaderboardEntry[] {
  return rankedItems.map((entry) => {
    const user = entry.user ?? {
      id: entry.id,
      name: entry.name,
      avatarKey: "buddy-1",
      teamName: "No Team",
      level: 1,
      xp: entry.xp,
      createdAt: new Date(0),
    };

    const isCreatedToday = user.createdAt.getTime() >= startOfTodayIST.getTime();
    const yesterdayRank = yesterdayRankMap?.get(entry.id);
    const { rankChange, isNew } = computeRankChange(entry.rank, yesterdayRank, isCreatedToday);

    const userSummary: UserSummary = {
      id: user.id,
      name: user.name,
      avatarKey: user.avatarKey,
      teamName: user.teamName,
      level: user.level,
      xp: user.xp,
    };

    return {
      rank: entry.rank,
      user: userSummary,
      xp: entry.xp,
      rankChange,
      ...(isNew ? { isNew: true } : {}),
    };
  });
}

/**
 * Assembles the final Leaderboard response:
 * - entries: top 50 entries
 * - me: viewer's entry even if outside top 50 (null for unranked users like managers/admins in company scope)
 */
export function assembleLeaderboard(
  scope: LeaderboardScope,
  period: LeaderboardPeriod,
  allEntries: readonly LeaderboardEntry[],
  viewerId: string,
): Leaderboard {
  const entries = allEntries.slice(0, LEADERBOARD_PAGE_SIZE);
  const mine = allEntries.find((e) => e.user.id === viewerId) ?? null;

  return {
    scope,
    period,
    entries,
    me: mine as unknown as LeaderboardEntry,
  };
}
