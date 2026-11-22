/**
 * The app's single timezone. "Today", streaks, daily quests, boss limits and
 * the weekly leaderboard all use this so frontend and backend agree.
 */
export const APP_TIMEZONE = "Asia/Kolkata";

/** Today's date (YYYY-MM-DD) in the app timezone. */
export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
