const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

// Asia/Kolkata is UTC+5:30 with no daylight saving time (DST).
const IST_OFFSET_MS = 19_800_000; // (5 * 60 + 30) * 60 * 1000

/**
 * Returns the milliseconds until the next Monday 00:00 in Asia/Kolkata (UTC+5:30).
 * If now is exactly Monday 00:00 IST, the next reset is 7 days away.
 */
export function msUntilWeekReset(now: Date = new Date()): number {
  const istTime = now.getTime() + IST_OFFSET_MS;
  const istDate = new Date(istTime);

  const day = istDate.getUTCDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const hours = istDate.getUTCHours();
  const minutes = istDate.getUTCMinutes();
  const seconds = istDate.getUTCSeconds();
  const millis = istDate.getUTCMilliseconds();

  const msIntoDay = ((hours * 60 + minutes) * 60 + seconds) * 1000 + millis;

  // Days from current day's 00:00 IST to the next Monday 00:00 IST:
  // Sunday (0) -> 1 day
  // Monday (1) -> 7 days
  // Tuesday (2) -> 6 days
  // Wednesday (3) -> 5 days
  // Thursday (4) -> 4 days
  // Friday (5) -> 3 days
  // Saturday (6) -> 2 days
  const daysToAdd = day === 0 ? 1 : 8 - day;

  return daysToAdd * DAY_MS - msIntoDay;
}

/**
 * Formats countdown milliseconds into human-readable strings:
 * - >= 1 day: "2d 4h" (days+hours)
 * - under 1 day (>= 1 hour): "5h 20m"
 * - under 1 hour (>= 1 min): "42m"
 * - under 1 minute: "less than a minute"
 */
export function formatResetIn(ms: number): string {
  if (Number.isNaN(ms) || ms < MINUTE_MS) {
    return "less than a minute";
  }

  if (ms < DAY_MS) {
    const totalMinutes = Math.floor(ms / MINUTE_MS);
    if (totalMinutes < 60) {
      return `${totalMinutes}m`;
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }

  const totalHours = Math.floor(ms / HOUR_MS);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return `${days}d ${hours}h`;
}
