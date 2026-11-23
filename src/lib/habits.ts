/**
 * Shared constants and pure helpers for automatic habit detection.
 * The backend (Khushi: habits, Mayur: activity) and the mocks both use these,
 * so thresholds live in exactly one place. See docs/contract-auto-habits.md.
 * Pure TypeScript: no React, Next or server imports.
 */
import type { CategoryKey, DayPart, HabitKind, HabitsOverview, HabitStage, HomeHabits } from "./types";

/** A behaviour must repeat on this many distinct days... */
export const HABIT_DETECT_MIN_DAYS = 3;
/** ...within this many trailing days, to appear as a habit (stage "forming"). */
export const HABIT_DETECT_WINDOW_DAYS = 14;
/** A habit not seen for this many days is "fading" (hidden from the main list). */
export const HABIT_FADING_AFTER_DAYS = 14;
/** A fading habit is forgotten completely after this many days without it. */
export const HABIT_FORGET_AFTER_DAYS = 56;
/** Days shown in the heatmap (12 weeks), oldest first. */
export const HABIT_HEATMAP_DAYS = 84;
/** A week "counts" when the behaviour hit at least this share of the usual days (min 1 day). */
export const HABIT_WEEK_ON_TRACK_SHARE = 0.6;
/** "building": the last 2 full weeks both counted. */
export const HABIT_BUILDING_WEEKS = 2;
/** "solid": the last 4 full weeks all counted AND consistency is at least the value below. */
export const HABIT_SOLID_WEEKS = 4;
export const HABIT_SOLID_MIN_CONSISTENCY = 0.8;
/** Consistency = usual days hit / usual days, over this many trailing weeks. */
export const HABIT_CONSISTENCY_WEEKS = 4;
/** Small XP bonus paid once per user, habit and stage (HabitStageAward guards it). */
export const HABIT_STAGE_XP: Readonly<Record<HabitStage, number>> = {
  forming: 5,
  building: 15,
  solid: 40,
};

/** Day parts in the app timezone (Asia/Kolkata). `endHour` is exclusive; "night" wraps past midnight. */
export const DAY_PARTS: Readonly<Record<DayPart, { readonly startHour: number; readonly endHour: number; readonly label: string }>> = {
  morning: { startHour: 5, endHour: 12, label: "Morning" },
  afternoon: { startHour: 12, endHour: 17, label: "Afternoon" },
  evening: { startHour: 17, endHour: 22, label: "Evening" },
  night: { startHour: 22, endHour: 5, label: "Night" },
};

/** The day part an hour (0 to 23, app timezone) falls in. */
export function dayPartForHour(hour: number): DayPart {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

/** The stable key of a habit: the kind, plus the category for category habits. */
export function habitKeyFor(kind: HabitKind, categoryKey: CategoryKey | null): string {
  return kind === "plays-category" && categoryKey ? `${kind}:${categoryKey}` : kind;
}

/** ISO 8601 week key of a "YYYY-MM-DD" date, e.g. "2026-W47" (weeks start on Monday). */
export function isoWeekKey(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  // Shift to the Thursday of this week: its year is the ISO week-year.
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((date.getTime() - yearStart) / 86_400_000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** The slim habit list for Home, derived from an overview. */
export function toHomeHabits(overview: HabitsOverview): HomeHabits {
  const live = overview.habits.filter((h) => h.status !== "fading");
  const ordered = [...live].sort((a, b) => Number(b.status === "slipping") - Number(a.status === "slipping"));
  return {
    items: ordered.slice(0, 3).map((h) => ({
      key: h.key,
      title: h.title,
      icon: h.icon,
      stage: h.stage,
      status: h.status,
      currentStreak: h.currentStreak,
      doneToday: h.doneToday,
    })),
    firstHabitsProgress: overview.firstHabits ? overview.firstHabits.progress : null,
    slippingCount: live.filter((h) => h.status === "slipping").length,
  };
}
