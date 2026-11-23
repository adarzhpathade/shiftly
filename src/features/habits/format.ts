/** Display helpers for habits. Pure: no React, no server or data imports. */
import type { DetectedHabit, HabitStage, HabitWindow } from "@/lib/types";

export const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** "Every day", "Weekdays", "Weekends" or "Mon, Wed, Fri" for ISO weekdays (1 = Mon). */
export function formatDays(days: readonly number[]): string {
  const set = [...new Set(days)].filter((d) => d >= 1 && d <= 7).sort((a, b) => a - b);
  if (set.length === 0) return "No fixed days";
  if (set.length === 7) return "Every day";
  if (set.join() === "1,2,3,4,5") return "Weekdays";
  if (set.join() === "6,7") return "Weekends";
  return set.map((d) => WEEKDAY_SHORT[d - 1]).join(", ");
}

/** 0 to 23 as "12 am", "5 am", "12 pm", "10 pm". */
export function formatHour(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  const suffix = h < 12 ? "am" : "pm";
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return `${twelve} ${suffix}`;
}

/** "Evenings, 5 to 10 pm", or "Any time" when the habit has no fixed window. */
export function formatWindow(window: HabitWindow | null): string {
  if (!window) return "Any time";
  const part = `${window.part.charAt(0).toUpperCase()}${window.part.slice(1)}s`;
  const start = formatHour(window.startHour);
  const end = formatHour(window.endHour);
  const [startNum, startSuffix] = start.split(" ") as [string, string];
  const [, endSuffix] = end.split(" ") as [string, string];
  const from = startSuffix === endSuffix ? startNum : start;
  return `${part}, ${from} to ${end}`;
}

export const STAGE_LABEL: Record<HabitStage, string> = {
  forming: "Forming",
  building: "Building",
  solid: "Solid",
};

/** A gentle line for a slipping habit. */
export function slippingNudge(habit: Pick<DetectedHabit, "currentStreak" | "usualWindow">): string {
  const when = habit.usualWindow ? ` this ${habit.usualWindow.part}` : " today";
  if (habit.currentStreak > 0) {
    return `Your ${habit.currentStreak}-day streak is on the line. Do it${when} to keep it.`;
  }
  return `It slipped a little. Do it${when} and you are back on track.`;
}

/** "3 day streak" with the right plural. */
export function streakText(n: number): string {
  return n === 1 ? "1 day streak" : `${n} day streak`;
}

const TZ = "Asia/Kolkata";

/** "Mon 17 Nov, 6:42 pm" in the app timezone. */
export function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
  })
    .format(d)
    .toLowerCase();
  return `${date.replace(",", "")}, ${time}`;
}

/** "17 Nov" for a "YYYY-MM-DD" date. */
export function formatShortDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}
