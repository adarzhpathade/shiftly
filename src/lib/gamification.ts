/**
 * Pure gamification rules shared by the frontend and the backend.
 * No framework, no I/O, no clock access: callers pass dates in.
 *
 * Level curve (gentle, quadratic):
 *   total XP needed to REACH level L  =  250 * (L - 1) * L / 2
 *   L1 = 0, L2 = 250, L3 = 750, L4 = 1500, L5 = 2500, L6 = 3750 ...
 *   going from level L to L+1 costs 250 * L XP.
 */

export type Stars = 0 | 1 | 2 | 3;

export const XP_PER_LEVEL_STEP = 250;

/** Boss level rules shared by UI and backend. */
export const BOSS_DAILY_LIMIT = 10;
export const MAX_BOSS_TURNS = 8;
export const MAX_REPLY_CHARS = 400;
export const MAX_LEVEL = 100;

/** Total XP required to reach `level` (level 1 needs 0). */
export function xpForLevel(level: number): number {
  const l = Math.max(1, Math.floor(level));
  return (XP_PER_LEVEL_STEP * (l - 1) * l) / 2;
}

/** The level a user with `xp` total XP is on (>= 1). */
export function levelForXp(xp: number): number {
  const safe = Math.max(0, xp);
  let level = Math.floor((1 + Math.sqrt(1 + (8 * safe) / XP_PER_LEVEL_STEP)) / 2);
  // Guard against floating point error at the exact boundaries.
  while (xpForLevel(level + 1) <= safe) level += 1;
  while (level > 1 && xpForLevel(level) > safe) level -= 1;
  return Math.min(Math.max(level, 1), MAX_LEVEL);
}

export interface LevelProgress {
  readonly level: number;
  /** XP earned since reaching the current level. */
  readonly xpIntoLevel: number;
  /** Size of the current level (XP between this level and the next). */
  readonly xpForNext: number;
  /** XP still missing for the next level. */
  readonly xpToNext: number;
  /** 0 to 1, for the XP bar. */
  readonly fraction: number;
}

export function progressToNextLevel(xp: number): LevelProgress {
  const safe = Math.max(0, xp);
  const level = levelForXp(safe);
  const base = xpForLevel(level);
  const xpForNext = xpForLevel(level + 1) - base;
  const xpIntoLevel = safe - base;
  return {
    level,
    xpIntoLevel,
    xpForNext,
    xpToNext: xpForNext - xpIntoLevel,
    fraction: xpForNext === 0 ? 1 : xpIntoLevel / xpForNext,
  };
}

/** >= 90% is 3 stars, >= 60% is 2, anything else 1 when completed (0 if not). */
export function starsForScore(score: number, max: number, completed = true): Stars {
  if (!completed) return 0;
  if (max <= 0) return 1;
  const ratio = score / max;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.6) return 2;
  return 1;
}

const STAR_XP_SHARE: Record<Stars, number> = { 0: 0, 1: 0.5, 2: 0.75, 3: 1 };

/** XP for finishing a guided scenario with `stars`; `base` is the scenario's full reward. */
export function guidedXp(stars: Stars, base: number): number {
  return Math.round(Math.max(0, base) * STAR_XP_SHARE[stars]);
}

/** Replays only pay the improvement over the previous best (0 if not better). */
export function replayXp(previousBestStars: Stars, newStars: Stars, base: number): number {
  return Math.max(0, guidedXp(newStars, base) - guidedXp(previousBestStars, base));
}

// ---------- Dates (ISO "YYYY-MM-DD" strings, timezone-free) ----------

const DAY_MS = 86_400_000;

function parseISODate(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** Format a Date as local "YYYY-MM-DD". */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: string, to: string): number {
  return Math.round((parseISODate(to) - parseISODate(from)) / DAY_MS);
}

export function addDays(iso: string, days: number): string {
  const t = new Date(parseISODate(iso) + days * DAY_MS);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}

/** ISO weekday of an ISO date: Monday = 1 ... Sunday = 7. */
export function isoWeekday(iso: string): number {
  const d = new Date(parseISODate(iso)).getUTCDay();
  return d === 0 ? 7 : d;
}

export type StreakStatus = "first" | "same-day" | "continued" | "reset";

export interface StreakUpdate {
  readonly streak: number;
  readonly status: StreakStatus;
}

/**
 * New streak after a check-in on `today`.
 * - no previous date: starts at 1 ("first")
 * - same day: unchanged ("same-day", already counted)
 * - the next day: current + 1 ("continued")
 * - any bigger gap: back to 1 ("reset")
 *
 * With `daysOfWeek` (ISO weekdays 1 to 7) only scheduled days count: the streak
 * continues unless a scheduled day was skipped between `lastDate` and `today`.
 */
export function streakAfterCheckIn(
  lastDate: string | null,
  today: string,
  current: number,
  daysOfWeek?: readonly number[],
): StreakUpdate {
  if (!lastDate) return { streak: 1, status: "first" };
  const gap = daysBetween(lastDate, today);
  if (gap <= 0) return { streak: Math.max(current, 1), status: "same-day" };
  if (daysOfWeek && daysOfWeek.length > 0 && daysOfWeek.length < 7) {
    for (let i = 1; i < gap; i++) {
      if (daysOfWeek.includes(isoWeekday(addDays(lastDate, i)))) return { streak: 1, status: "reset" };
    }
    return { streak: Math.max(current, 0) + 1, status: "continued" };
  }
  if (gap === 1) return { streak: Math.max(current, 0) + 1, status: "continued" };
  return { streak: 1, status: "reset" };
}

export const STREAK_MILESTONES = [7, 30, 100] as const;

/** The milestone just reached by `streak`, or undefined. */
export function streakMilestone(streak: number): 7 | 30 | 100 | undefined {
  return STREAK_MILESTONES.find((m) => m === streak);
}
