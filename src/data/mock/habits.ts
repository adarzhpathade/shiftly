import { addDays, isoWeekday, levelForXp, streakAfterCheckIn, streakMilestone } from "@/lib/gamification";
import type { CheckInResult, Habit, HabitDetail } from "@/lib/types";
import type { HabitRepository } from "../repositories";
import { HABIT_TEMPLATES } from "./data";
import { delay } from "./delay";
import { awardBadges, bumpQuests, grantXp, nextId, state, today, touchActivity, type HabitRecord } from "./state";

const CHECK_IN_XP = 10;
const HEATMAP_DAYS = 84;

function toHabit(r: HabitRecord): Habit {
  const now = today();
  // A streak is alive unless a scheduled day was skipped since the last check-in.
  const alive = r.lastCheckIn !== null && streakAfterCheckIn(r.lastCheckIn, now, r.currentStreak, r.daysOfWeek).status !== "reset";
  return {
    id: r.id,
    title: r.title,
    icon: r.icon,
    frequency: r.frequency,
    daysOfWeek: [...r.daysOfWeek],
    reminderTime: r.reminderTime,
    currentStreak: alive ? r.currentStreak : 0,
    bestStreak: r.bestStreak,
    doneToday: r.logs.has(now),
    scheduledToday: r.daysOfWeek.includes(isoWeekday(now)),
  };
}

function find(habitId: string): HabitRecord {
  const rec = state.habits.find((h) => h.id === habitId);
  if (!rec) throw new Error(`Habit not found: ${habitId}`);
  return rec;
}

export const mockHabitRepo: HabitRepository = {
  async listToday() {
    await delay();
    return state.habits.map(toHabit);
  },

  async listTemplates() {
    await delay();
    return HABIT_TEMPLATES;
  },

  async create(_userId, input) {
    await delay();
    const rec: HabitRecord = {
      id: nextId("h"),
      title: input.title,
      icon: input.icon,
      frequency: input.frequency,
      daysOfWeek: [...input.daysOfWeek],
      reminderTime: input.reminderTime,
      currentStreak: 0,
      bestStreak: 0,
      lastCheckIn: null,
      logs: new Map(),
    };
    state.habits.push(rec);
    return toHabit(rec);
  },

  async update(_userId, habitId, patch) {
    await delay();
    const rec = find(habitId);
    if (patch.title !== undefined) rec.title = patch.title;
    if (patch.icon !== undefined) rec.icon = patch.icon;
    if (patch.frequency !== undefined) rec.frequency = patch.frequency;
    if (patch.daysOfWeek !== undefined) rec.daysOfWeek = [...patch.daysOfWeek];
    if (patch.reminderTime !== undefined) rec.reminderTime = patch.reminderTime;
    return toHabit(rec);
  },

  async remove(_userId, habitId) {
    await delay();
    find(habitId);
    state.habits = state.habits.filter((h) => h.id !== habitId);
  },

  async checkIn(_userId, habitId, note): Promise<CheckInResult> {
    await delay();
    const rec = find(habitId);
    const now = today();
    if (rec.logs.has(now)) {
      const habit = toHabit(rec);
      return { habit, xpEarned: 0, streak: habit.currentStreak, newBadges: [], questsCompleted: [] };
    }
    const current = toHabit(rec).currentStreak;
    const update = streakAfterCheckIn(rec.lastCheckIn, now, current, rec.daysOfWeek);
    rec.currentStreak = update.streak;
    rec.bestStreak = Math.max(rec.bestStreak, update.streak);
    rec.lastCheckIn = now;
    rec.logs.set(now, note?.trim() ?? "");

    state.counters.habitCheckIns += 1;
    touchActivity();

    const before = levelForXp(state.user.xp);
    grantXp(CHECK_IN_XP);
    const questsCompleted = bumpQuests("habit");
    const after = levelForXp(state.user.xp);

    const milestone = streakMilestone(update.streak);
    const newBadges = milestone === 7 ? awardBadges(["seven-day-streak"]) : [];

    return {
      habit: toHabit(rec),
      xpEarned: CHECK_IN_XP,
      streak: update.streak,
      ...(milestone ? { milestone } : {}),
      ...(after > before ? { leveledUp: { newLevel: after } } : {}),
      newBadges,
      questsCompleted,
    };
  },

  async getDetail(_userId, habitId): Promise<HabitDetail> {
    await delay();
    const rec = find(habitId);
    const now = today();
    const heatmap: { date: string; done: boolean }[] = [];
    let scheduled = 0;
    let done = 0;
    for (let i = HEATMAP_DAYS - 1; i >= 0; i--) {
      const date = addDays(now, -i);
      const isDone = rec.logs.has(date);
      heatmap.push({ date, done: isDone });
      if (rec.daysOfWeek.includes(isoWeekday(date)) || isDone) {
        scheduled += 1;
        if (isDone) done += 1;
      }
    }
    const notes = [...rec.logs.entries()]
      .filter(([, text]) => text.length > 0)
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([date, text]) => ({ date, text }));
    return { ...toHabit(rec), heatmap, completionRate: scheduled === 0 ? 0 : done / scheduled, notes };
  },
};
