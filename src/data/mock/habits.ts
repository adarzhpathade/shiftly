/**
 * Mock HabitRepository: realistic demo data for the automatically detected habits.
 *
 * Demo user (everyone except the new-user variant) has 3 visible habits in different stages
 * and statuses (one slipping), 1 hidden fading habit, insights, a next-habit suggestion and
 * a coach note. The new-user variant (user id starting "u-new" or "u-brand-new", or
 * MOCK_HABITS_VARIANT=new) has no habits but a "first habits forming" progress value.
 *
 * Dates are relative to today so heatmaps always end today. Nothing here detects anything:
 * the real detection (Khushi) computes the same shapes from ActivityEvent rows.
 *
 * TODO(Khushi): real HabitRepository in src/server/habits/ (getOverview, getDetail), wired in src/data/index.ts.
 * TODO(Mayur): real getCoachNote (AI + cache + rules fallback), CoachNote table.
 */
import { addDays, isoWeekday } from "@/lib/gamification";
import {
  DAY_PARTS,
  HABIT_DETECT_MIN_DAYS,
  HABIT_HEATMAP_DAYS,
  isoWeekKey,
} from "@/lib/habits";
import type {
  CoachNote,
  DayPart,
  DetectedHabit,
  HabitDetail,
  HabitHeatCell,
  HabitInsights,
  HabitOccurrence,
  HabitsOverview,
  HabitStage,
  HabitStatus,
  HabitWindow,
} from "@/lib/types";
import type { HabitRepository } from "../repositories";
import { delay } from "./delay";
import { state, today } from "./state";

const NEW_USER_ID = /^u-(brand-)?new/;

/** True for the "no habits yet" variant. */
export function isNewHabitUser(userId: string): boolean {
  return process.env.MOCK_HABITS_VARIANT === "new" || NEW_USER_ID.test(userId);
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function windowOf(part: DayPart): HabitWindow {
  const { startHour, endHour } = DAY_PARTS[part];
  return { part, startHour, endHour };
}

interface Spec {
  key: string;
  kind: DetectedHabit["kind"];
  categoryKey: DetectedHabit["categoryKey"];
  title: string;
  description: string;
  icon: string;
  usualDays: readonly number[];
  part: DayPart | null;
  stage: HabitStage;
  status: HabitStatus;
  currentStreak: number;
  bestStreak: number;
  consistency: number;
  /** Heatmap: chance (0 to 100) of a hit on a usual day. */
  hitRate: number;
  /** Heatmap: no hits in the most recent N days (0 = up to today). */
  quietDays: number;
  /** Hour of day used for lastSeenAt. */
  hour: number;
}

function buildHeatmap(spec: Spec): HabitHeatCell[] {
  const now = today();
  const cells: HabitHeatCell[] = [];
  for (let i = HABIT_HEATMAP_DAYS - 1; i >= 0; i--) {
    const date = addDays(now, -i);
    let count = 0;
    if (i >= spec.quietDays) {
      const usual = spec.usualDays.includes(isoWeekday(date));
      const roll = hash(`${spec.key}:${date}`) % 100;
      // Older weeks are patchier: habits grow over time.
      const weeksAgo = Math.floor(i / 7);
      const rate = Math.max(15, spec.hitRate - weeksAgo * 6);
      if (usual && roll < rate) count = 1 + (roll % 7 === 0 ? 1 : 0);
      else if (!usual && roll < 6) count = 1;
    }
    cells.push({ date, count });
  }
  return cells;
}

function build(spec: Spec): DetectedHabit {
  const heatmap = buildHeatmap(spec);
  const last = [...heatmap].reverse().find((c) => c.count > 0);
  const seenAt = last ? new Date(`${last.date}T${String(spec.hour).padStart(2, "0")}:15:00.000Z`).toISOString() : new Date().toISOString();
  return {
    key: spec.key,
    kind: spec.kind,
    categoryKey: spec.categoryKey,
    title: spec.title,
    description: spec.description,
    icon: spec.icon,
    usualDays: [...spec.usualDays],
    usualWindow: spec.part ? windowOf(spec.part) : null,
    stage: spec.stage,
    status: spec.status,
    currentStreak: spec.currentStreak,
    bestStreak: spec.bestStreak,
    consistency: spec.consistency,
    doneToday: heatmap[heatmap.length - 1]?.count ? true : false,
    heatmap,
    lastSeenAt: seenAt,
  };
}

const SPECS: readonly Spec[] = [
  {
    key: "clocks-in",
    kind: "clocks-in",
    categoryKey: null,
    title: "Clocks in every morning",
    description: "You open Shiftly before noon on most weekdays.",
    icon: "clock",
    usualDays: [1, 2, 3, 4, 5],
    part: "morning",
    stage: "solid",
    status: "on_track",
    currentStreak: 14,
    bestStreak: 21,
    consistency: 0.9,
    hitRate: 92,
    quietDays: 0,
    hour: 3,
  },
  {
    key: "trains",
    kind: "trains",
    categoryKey: null,
    title: "Trains on weekday evenings",
    description: "You finished 6 scenarios in the last 14 days, mostly Mon to Thu after 5 pm.",
    icon: "book",
    usualDays: [1, 2, 3, 4],
    part: "evening",
    stage: "building",
    status: "slipping",
    currentStreak: 0,
    bestStreak: 6,
    consistency: 0.62,
    hitRate: 70,
    quietDays: 3,
    hour: 13,
  },
  {
    key: "plays-category:handling-complaints",
    kind: "plays-category",
    categoryKey: "handling-complaints",
    title: "Plays Handling Complaints 3x a week",
    description: "You practised Handling Complaints on 3 different days in the last 14 days.",
    icon: "megaphone",
    usualDays: [1, 3, 5],
    part: "afternoon",
    stage: "forming",
    status: "on_track",
    currentStreak: 2,
    bestStreak: 2,
    consistency: 0.5,
    hitRate: 45,
    quietDays: 0,
    hour: 9,
  },
  {
    key: "boss-fights",
    kind: "boss-fights",
    categoryKey: null,
    title: "Takes on boss customers",
    description: "You used to face a boss customer most weeks, but not lately.",
    icon: "rocket",
    usualDays: [2, 5],
    part: "evening",
    stage: "building",
    status: "fading",
    currentStreak: 0,
    bestStreak: 4,
    consistency: 0.1,
    hitRate: 55,
    quietDays: 21,
    hour: 14,
  },
];

function demoHabits(): DetectedHabit[] {
  return SPECS.map(build);
}

const STAGE_ORDER: Record<HabitStage, number> = { solid: 0, building: 1, forming: 2 };

function demoOverview(coachNote: CoachNote): HabitsOverview {
  const all = demoHabits();
  const visible = all
    .filter((h) => h.status !== "fading")
    .sort((a, b) => STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage]);
  const insights: HabitInsights = {
    bestTimeOfDay: { part: "evening", text: "Most of your training happens in the evening, between 5 and 10 pm." },
    mostSkippedWeekday: { isoWeekday: 3, text: "Wednesday is the day you skip most. Try a quick 5 minute round." },
    skillLink: { liftPercent: 12, text: "On days you train in the morning your scores are 12% higher." },
    streakAtRisk: { habitKey: "clocks-in", text: "Clock in tomorrow morning to keep your 14 day streak alive." },
  };
  return {
    habits: visible,
    fadingCount: all.length - visible.length,
    nextHabit: {
      kind: "plays-category",
      categoryKey: "difficult-customers",
      title: "Play Difficult Customers Mon/Wed/Fri",
      reason: "Difficult Customers is your weakest category. A little practice there lifts your overall score.",
      icon: "target",
      suggestedDays: [1, 3, 5],
      occurrences: 1,
      needed: HABIT_DETECT_MIN_DAYS,
      progress: 1 / HABIT_DETECT_MIN_DAYS,
    },
    insights,
    coachNote,
    firstHabits: null,
  };
}

function newUserOverview(coachNote: CoachNote): HabitsOverview {
  return {
    habits: [],
    fadingCount: 0,
    nextHabit: null,
    insights: { bestTimeOfDay: null, mostSkippedWeekday: null, skillLink: null, streakAtRisk: null },
    coachNote,
    firstHabits: {
      progress: 1 / HABIT_DETECT_MIN_DAYS,
      occurrences: 1,
      needed: HABIT_DETECT_MIN_DAYS,
      hint: "Finish 2 more scenarios on different days and your first habit appears.",
    },
  };
}

function coachFor(userId: string): CoachNote {
  const now = today();
  const isoWeek = isoWeekKey(now);
  const cacheKey = `${userId}:${isoWeek}`;
  const cached = state.coachNotes.get(cacheKey);
  if (cached) return cached;
  const fresh: CoachNote = isNewHabitUser(userId)
    ? {
        isoWeek,
        lines: [
          "Welcome to Shiftly. Your habits show up on their own.",
          "Finish a scenario on 3 different days and your first habit appears.",
          "Short and often beats long and rare. Five minutes counts.",
        ],
        source: "rules",
        generatedAt: new Date().toISOString(),
      }
    : {
        isoWeek,
        lines: [
          "Great week: you clocked in every weekday morning.",
          "Evening training slipped after Monday. One round tonight restarts it.",
          "Try Difficult Customers on Wed: it is your best chance to level up.",
        ],
        source: "ai",
        generatedAt: new Date().toISOString(),
      };
  state.coachNotes.set(cacheKey, fresh);
  return fresh;
}

function weekStartOf(iso: string): string {
  return addDays(iso, -(isoWeekday(iso) - 1));
}

function occurrenceLabel(habit: DetectedHabit): string {
  switch (habit.kind) {
    case "clocks-in":
      return "Clocked in";
    case "boss-fights":
      return "Finished a boss level";
    case "completes-quests":
      return "Completed a daily quest";
    case "perfect-scores":
      return "Scored 3 stars";
    case "plays-category":
      return "Finished a scenario in this category";
    default:
      return "Finished a training scenario";
  }
}

function toDetail(habit: DetectedHabit): HabitDetail {
  const byWeek = new Map<string, number>();
  for (const cell of habit.heatmap) {
    const week = weekStartOf(cell.date);
    byWeek.set(week, (byWeek.get(week) ?? 0) + cell.count);
  }
  const weeklyCounts = [...byWeek.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(-12)
    .map(([weekStart, count]) => ({ weekStart, count }));
  const label = occurrenceLabel(habit);
  const recent: HabitOccurrence[] = [...habit.heatmap]
    .reverse()
    .filter((c) => c.count > 0)
    .slice(0, 10)
    .map((c) => ({ at: new Date(`${c.date}T12:00:00.000Z`).toISOString(), label }));
  const statusNote =
    habit.status === "slipping"
      ? "A usual day went by without it. Do it once and you are back on track."
      : habit.status === "fading"
        ? "Not seen for over 2 weeks, so it is hidden from your list. Do it 3 times in 14 days to bring it back."
        : null;
  const nextStage =
    habit.stage === "solid"
      ? null
      : habit.stage === "building"
        ? { stage: "solid" as const, progress: 0.5, hint: "Stay on track for 2 more weeks with 80% consistency." }
        : { stage: "building" as const, progress: 0.4, hint: "Stay on track for 2 weeks in a row." };
  return { ...habit, weeklyCounts, recent, statusNote, nextStage };
}

export const mockHabitRepo: HabitRepository = {
  async getOverview(userId) {
    await delay();
    const note = coachFor(userId);
    return isNewHabitUser(userId) ? newUserOverview(note) : demoOverview(note);
  },

  async getDetail(userId, habitKey) {
    await delay();
    if (isNewHabitUser(userId)) throw new Error(`Habit not found: ${habitKey}`);
    const habit = demoHabits().find((h) => h.key === habitKey);
    if (!habit) throw new Error(`Habit not found: ${habitKey}`);
    return toDetail(habit);
  },

  async getCoachNote(userId) {
    await delay();
    return coachFor(userId);
  },
};
