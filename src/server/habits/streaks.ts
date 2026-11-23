import { streakAfterCheckIn } from "@/lib/gamification";
import { todayISO } from "@/lib/time";

export const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

export interface HabitStreakResult {
  readonly currentStreak: number;
  readonly bestStreak: number;
}

/**
 * Normalizes date inputs (Date objects or strings) into ISO "YYYY-MM-DD" format.
 */
export function toISODateString(date: string | Date): string {
  if (typeof date === "string") {
    return date.slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

/**
 * Computes current streak and best streak from a list of check-in log dates and a schedule.
 *
 * Rules:
 * - Dates are sorted chronologically and deduplicated (same-day check-ins count once).
 * - Streaks are calculated using `streakAfterCheckIn` respecting `daysOfWeek`.
 * - Scheduled days: if a habit is weekday-only (daysOfWeek: [1..5]), weekends are not scheduled
 *   and do not break the streak.
 * - Current streak remains alive as of `today` if no scheduled days were missed between the last
 *   check-in and `today`. If a scheduled day was missed, current streak resets to 0.
 * - Empty history returns currentStreak: 0, bestStreak: 0.
 */
export function computeHabitStreaks(
  logDates: readonly (string | Date)[],
  daysOfWeek: readonly number[] = ALL_DAYS,
  today: string = todayISO(),
): HabitStreakResult {
  if (logDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  // Deduplicate and sort dates ascending
  const uniqueDates = Array.from(new Set(logDates.map(toISODateString))).sort((a, b) =>
    a.localeCompare(b),
  );

  if (uniqueDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  const effectiveSchedule = daysOfWeek.length > 0 ? daysOfWeek : ALL_DAYS;

  let runningStreak = 0;
  let bestStreak = 0;
  let prevDate: string | null = null;

  for (const date of uniqueDates) {
    const update = streakAfterCheckIn(prevDate, date, runningStreak, effectiveSchedule);
    runningStreak = update.streak;
    if (runningStreak > bestStreak) {
      bestStreak = runningStreak;
    }
    prevDate = date;
  }

  if (!prevDate) {
    return { currentStreak: 0, bestStreak };
  }

  // If last check-in was today or in the future
  if (prevDate >= today) {
    return { currentStreak: runningStreak, bestStreak };
  }

  // Test if streak is still alive as of today (i.e. whether any scheduled day was skipped)
  const testAlive = streakAfterCheckIn(prevDate, today, runningStreak, effectiveSchedule);
  const isAlive = testAlive.status !== "reset";

  return {
    currentStreak: isAlive ? runningStreak : 0,
    bestStreak,
  };
}
