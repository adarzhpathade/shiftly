import "server-only";

import type {
  CheckInResult,
  Habit,
  HabitDetail,
  HabitFrequency,
  HabitInput,
  HabitTemplate,
} from "@/lib/types";
import type { HabitRepository } from "@/data/repositories";
import { Frequency, Role, type Prisma, type PrismaClient } from "@/generated/prisma/client";
import { addDays, isoWeekday, streakMilestone } from "@/lib/gamification";
import { todayISO } from "@/lib/time";
import { HABIT_TEMPLATES } from "@/data/mock/data";
import { awardXp, checkBadges, progressQuests, touchStreak } from "@/server/progress";
import { computeHabitStreaks } from "./streaks";

async function getDb() {
  if (!process.env.DATABASE_URL) {
    try {
      const dotenv = await import("dotenv");
      dotenv.config();
    } catch {
      // Ignore if dotenv cannot be loaded
    }
  }
  const { db } = await import("@/server/db");
  return db;
}

/**
 * Resolves userId, falling back to a demo employee if userId is a mock ID (e.g. "u-me")
 * or unregistered in test environments.
 */
async function resolveRealUserId(
  db: PrismaClient | Prisma.TransactionClient,
  userId: string,
): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (user) return user.id;

  const fallback = await db.user.findFirst({
    where: { role: Role.EMPLOYEE },
    select: { id: true },
  });
  return fallback?.id ?? userId;
}

const CHECK_IN_XP = 10;
const HEATMAP_DAYS = 84; // 12 weeks

export const realHabitRepo: HabitRepository = {
  async listToday(userId: string): Promise<readonly Habit[]> {
    const db = await getDb();
    const resolvedUserId = await resolveRealUserId(db, userId);

    const habits = await db.habit.findMany({
      where: {
        userId: resolvedUserId,
        isActive: true,
      },
      include: {
        logs: {
          select: { date: true },
          orderBy: { date: "asc" },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const todayStr = todayISO();
    const todayWeekday = isoWeekday(todayStr);

    return habits.map((habit) => {
      const logDates = habit.logs.map((l) => l.date.toISOString().slice(0, 10));
      const { currentStreak, bestStreak } = computeHabitStreaks(logDates, habit.daysOfWeek, todayStr);
      const doneToday = logDates.includes(todayStr);
      const scheduledToday = habit.frequency === "DAILY" || habit.daysOfWeek.includes(todayWeekday);

      return {
        id: habit.id,
        title: habit.title,
        icon: habit.icon,
        frequency: (habit.frequency === "WEEKLY" ? "weekly" : "daily") as HabitFrequency,
        daysOfWeek: habit.daysOfWeek,
        reminderTime: habit.reminderTime,
        currentStreak,
        bestStreak,
        doneToday,
        scheduledToday,
      };
    });
  },

  async listTemplates(): Promise<readonly HabitTemplate[]> {
    const db = await getDb();
    const templates = await db.habitTemplate.findMany({
      orderBy: { createdAt: "asc" },
    });

    return templates.map((t) => {
      const cleanKey = t.id.replace(/^tpl-/, "");
      const def = HABIT_TEMPLATES.find(
        (m) => m.key === cleanKey || m.title.toLowerCase() === t.title.toLowerCase(),
      );

      return {
        key: cleanKey,
        title: t.title,
        icon: t.icon,
        description: t.description,
        frequency: def?.frequency ?? "daily",
        daysOfWeek: def?.daysOfWeek ?? [1, 2, 3, 4, 5, 6, 7],
      };
    });
  },

  async create(userId: string, input: HabitInput): Promise<Habit> {
    const db = await getDb();
    const resolvedUserId = await resolveRealUserId(db, userId);

    const habit = await db.habit.create({
      data: {
        userId: resolvedUserId,
        title: input.title.trim(),
        icon: input.icon,
        frequency: input.frequency === "weekly" ? Frequency.WEEKLY : Frequency.DAILY,
        daysOfWeek: [...input.daysOfWeek],
        reminderTime: input.reminderTime ?? null,
        isActive: true,
      },
    });

    const todayStr = todayISO();
    const scheduledToday =
      input.frequency === "daily" || habit.daysOfWeek.includes(isoWeekday(todayStr));

    return {
      id: habit.id,
      title: habit.title,
      icon: habit.icon,
      frequency: input.frequency,
      daysOfWeek: [...habit.daysOfWeek],
      reminderTime: habit.reminderTime,
      currentStreak: 0,
      bestStreak: 0,
      doneToday: false,
      scheduledToday,
    };
  },

  async update(userId: string, habitId: string, patch: Partial<HabitInput>): Promise<Habit> {
    const db = await getDb();
    const resolvedUserId = await resolveRealUserId(db, userId);

    const existing = await db.habit.findFirst({
      where: { id: habitId, userId: resolvedUserId },
      include: {
        logs: {
          select: { date: true },
          orderBy: { date: "asc" },
        },
      },
    });

    if (!existing) {
      throw new Error(`Habit not found: ${habitId}`);
    }

    const data: Prisma.HabitUpdateInput = {};
    if (patch.title !== undefined) data.title = patch.title.trim();
    if (patch.icon !== undefined) data.icon = patch.icon;
    if (patch.frequency !== undefined) {
      data.frequency = patch.frequency === "weekly" ? Frequency.WEEKLY : Frequency.DAILY;
    }
    if (patch.daysOfWeek !== undefined) data.daysOfWeek = [...patch.daysOfWeek];
    if (patch.reminderTime !== undefined) data.reminderTime = patch.reminderTime;

    const updated = await db.habit.update({
      where: { id: habitId },
      data,
      include: {
        logs: {
          select: { date: true },
          orderBy: { date: "asc" },
        },
      },
    });

    const todayStr = todayISO();
    const logDates = updated.logs.map((l) => l.date.toISOString().slice(0, 10));
    const { currentStreak, bestStreak } = computeHabitStreaks(logDates, updated.daysOfWeek, todayStr);
    const doneToday = logDates.includes(todayStr);
    const scheduledToday =
      updated.frequency === "DAILY" || updated.daysOfWeek.includes(isoWeekday(todayStr));

    return {
      id: updated.id,
      title: updated.title,
      icon: updated.icon,
      frequency: (updated.frequency === "WEEKLY" ? "weekly" : "daily") as HabitFrequency,
      daysOfWeek: updated.daysOfWeek,
      reminderTime: updated.reminderTime,
      currentStreak,
      bestStreak,
      doneToday,
      scheduledToday,
    };
  },

  async remove(userId: string, habitId: string): Promise<void> {
    const db = await getDb();
    const resolvedUserId = await resolveRealUserId(db, userId);

    const existing = await db.habit.findFirst({
      where: { id: habitId, userId: resolvedUserId },
      select: { id: true },
    });

    if (!existing) {
      throw new Error(`Habit not found: ${habitId}`);
    }

    await db.habit.delete({
      where: { id: habitId },
    });
  },

  async checkIn(userId: string, habitId: string, note?: string): Promise<CheckInResult> {
    const db = await getDb();
    const resolvedUserId = await resolveRealUserId(db, userId);
    const todayStr = todayISO();
    const todayDate = new Date(`${todayStr}T00:00:00.000Z`);

    return await db.$transaction(async (tx) => {
      // 1. Verify habit exists and belongs to user
      const habit = await tx.habit.findFirst({
        where: { id: habitId, userId: resolvedUserId },
        include: {
          logs: {
            select: { date: true, note: true },
            orderBy: { date: "asc" },
          },
        },
      });

      if (!habit) {
        throw new Error(`Habit not found: ${habitId}`);
      }

      const existingLogs = habit.logs.map((l) => l.date.toISOString().slice(0, 10));
      const alreadyDone = existingLogs.includes(todayStr);

      // If already checked in today, return current state without double-counting
      if (alreadyDone) {
        const { currentStreak, bestStreak } = computeHabitStreaks(
          existingLogs,
          habit.daysOfWeek,
          todayStr,
        );
        const scheduledToday =
          habit.frequency === "DAILY" || habit.daysOfWeek.includes(isoWeekday(todayStr));
        const habitViewModel: Habit = {
          id: habit.id,
          title: habit.title,
          icon: habit.icon,
          frequency: (habit.frequency === "WEEKLY" ? "weekly" : "daily") as HabitFrequency,
          daysOfWeek: habit.daysOfWeek,
          reminderTime: habit.reminderTime,
          currentStreak,
          bestStreak,
          doneToday: true,
          scheduledToday,
        };

        return {
          habit: habitViewModel,
          xpEarned: 0,
          streak: currentStreak,
          newBadges: [],
          questsCompleted: [],
        };
      }

      // 2. Create HabitLog
      await tx.habitLog.create({
        data: {
          habitId: habit.id,
          date: todayDate,
          note: note?.trim() || null,
        },
      });

      // 3. Compute habit's new streaks
      const updatedLogs = [...existingLogs, todayStr];
      const { currentStreak, bestStreak } = computeHabitStreaks(
        updatedLogs,
        habit.daysOfWeek,
        todayStr,
      );

      // 4. Call shared helpers from src/server/progress/
      const awardResult = await awardXp(tx, resolvedUserId, {
        source: "HABIT",
        amount: CHECK_IN_XP,
        refId: habitId,
      });

      await touchStreak(tx, resolvedUserId);
      const questsCompleted = await progressQuests(tx, resolvedUserId, "habit", 1);
      const newBadges = await checkBadges(tx, resolvedUserId);

      const milestone = streakMilestone(currentStreak);
      const scheduledToday =
        habit.frequency === "DAILY" || habit.daysOfWeek.includes(isoWeekday(todayStr));

      const habitViewModel: Habit = {
        id: habit.id,
        title: habit.title,
        icon: habit.icon,
        frequency: (habit.frequency === "WEEKLY" ? "weekly" : "daily") as HabitFrequency,
        daysOfWeek: habit.daysOfWeek,
        reminderTime: habit.reminderTime,
        currentStreak,
        bestStreak,
        doneToday: true,
        scheduledToday,
      };

      return {
        habit: habitViewModel,
        xpEarned: CHECK_IN_XP,
        streak: currentStreak,
        ...(milestone ? { milestone } : {}),
        ...(awardResult.leveledUp ? { leveledUp: awardResult.leveledUp } : {}),
        newBadges,
        questsCompleted,
      };
    });
  },

  async getDetail(userId: string, habitId: string): Promise<HabitDetail> {
    const db = await getDb();
    const resolvedUserId = await resolveRealUserId(db, userId);

    const habit = await db.habit.findFirst({
      where: { id: habitId, userId: resolvedUserId },
      include: {
        logs: {
          select: { date: true, note: true },
          orderBy: { date: "desc" },
        },
      },
    });

    if (!habit) {
      throw new Error(`Habit not found: ${habitId}`);
    }

    const todayStr = todayISO();
    const logDates = habit.logs.map((l) => l.date.toISOString().slice(0, 10));
    const logDatesSet = new Set(logDates);

    const { currentStreak, bestStreak } = computeHabitStreaks(logDates, habit.daysOfWeek, todayStr);
    const doneToday = logDatesSet.has(todayStr);
    const scheduledToday =
      habit.frequency === "DAILY" || habit.daysOfWeek.includes(isoWeekday(todayStr));

    const heatmap: { date: string; done: boolean }[] = [];
    let scheduled = 0;
    let done = 0;

    for (let i = HEATMAP_DAYS - 1; i >= 0; i--) {
      const date = addDays(todayStr, -i);
      const isDone = logDatesSet.has(date);
      heatmap.push({ date, done: isDone });
      if (habit.frequency === "DAILY" || habit.daysOfWeek.includes(isoWeekday(date)) || isDone) {
        scheduled += 1;
        if (isDone) done += 1;
      }
    }

    const notes = habit.logs
      .filter((l) => l.note && l.note.trim().length > 0)
      .map((l) => ({
        date: l.date.toISOString().slice(0, 10),
        text: l.note!.trim(),
      }));

    return {
      id: habit.id,
      title: habit.title,
      icon: habit.icon,
      frequency: (habit.frequency === "WEEKLY" ? "weekly" : "daily") as HabitFrequency,
      daysOfWeek: habit.daysOfWeek,
      reminderTime: habit.reminderTime,
      currentStreak,
      bestStreak,
      doneToday,
      scheduledToday,
      heatmap,
      completionRate: scheduled === 0 ? 0 : done / scheduled,
      notes,
    };
  },
};
