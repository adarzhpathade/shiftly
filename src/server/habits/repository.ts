import "server-only";

import type { HabitRepository } from "@/data/repositories";
import { HabitStageName, type Prisma, type PrismaClient } from "@/generated/prisma/client";
import { HABIT_HEATMAP_DAYS, HABIT_STAGE_XP, isoWeekKey } from "@/lib/habits";
import { todayISO } from "@/lib/time";
import type {
  CategoryKey,
  CoachNote,
  HabitDetail,
  HabitsOverview,
  HabitStage,
} from "@/lib/types";
import { awardXp } from "@/server/progress";
import {
  analyzeHabits,
  buildHabitDetail,
  detectHabits,
  type CategoryInfo,
  type RawActivityEvent,
} from "./analyzer";

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

const STAGE_NAME_MAP: Record<HabitStage, HabitStageName> = {
  forming: HabitStageName.FORMING,
  building: HabitStageName.BUILDING,
  solid: HabitStageName.SOLID,
};

async function verifyUserExists(
  db: PrismaClient | Prisma.TransactionClient,
  userId: string,
): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }
}

/**
 * Loads activity events and categories for the user to pass to the pure analyzer.
 */
async function loadUserData(
  db: PrismaClient,
  userId: string,
) {
  // 140 days covers the 84-day heatmap plus 56-day retention window
  const cutoffDate = new Date(Date.now() - (HABIT_HEATMAP_DAYS + 56) * 24 * 60 * 60 * 1000);

  const [categories, events, attempts] = await Promise.all([
    db.category.findMany({
      orderBy: { order: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        objectKey: true,
      },
    }),
    db.activityEvent.findMany({
      where: {
        userId,
        createdAt: { gte: cutoffDate },
      },
      select: {
        id: true,
        type: true,
        categoryId: true,
        stars: true,
        meta: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.attempt.findMany({
      where: {
        userId,
      },
      select: {
        stars: true,
        scenario: { select: { categoryId: true } },
      },
    }),
  ]);

  const categorySlugById = new Map<string, CategoryKey>(
    categories.map((c) => [c.id, c.slug as CategoryKey]),
  );

  const categoryStarsMap = new Map<string, number>();
  for (const a of attempts) {
    const catId = a.scenario.categoryId;
    categoryStarsMap.set(catId, (categoryStarsMap.get(catId) ?? 0) + a.stars);
  }

  const categoryInfos: CategoryInfo[] = categories.map((cat) => {
    const stars = categoryStarsMap.get(cat.id) ?? 0;
    return {
      key: cat.slug as CategoryKey,
      name: cat.name,
      stars,
      mastery: Math.min(1, stars / 15),
      objectKey: cat.objectKey,
    };
  });

  const rawEvents: RawActivityEvent[] = events.map((ev) => ({
    id: ev.id,
    type: ev.type.toLowerCase(),
    categoryKey: ev.categoryId ? categorySlugById.get(ev.categoryId) ?? null : null,
    stars: ev.stars,
    createdAt: ev.createdAt,
    meta: ev.meta,
  }));

  return { categoryInfos, rawEvents };
}

/**
 * Checks and awards stage-up XP for newly reached habit stages.
 * Guaranteed idempotent by HabitStageAward unique constraint (userId, habitKey, stage).
 */
async function awardNewStageXp(
  db: PrismaClient,
  userId: string,
  overview: HabitsOverview,
): Promise<void> {
  const existingAwards = await db.habitStageAward.findMany({
    where: { userId },
    select: { habitKey: true, stage: true },
  });

  const awardedSet = new Set(existingAwards.map((a) => `${a.habitKey}:${a.stage}`));

  for (const h of overview.habits) {
    const stagesToAward: HabitStage[] = [];
    if (h.stage === "forming") {
      stagesToAward.push("forming");
    } else if (h.stage === "building") {
      stagesToAward.push("forming", "building");
    } else if (h.stage === "solid") {
      stagesToAward.push("forming", "building", "solid");
    }

    for (const st of stagesToAward) {
      const stageName = STAGE_NAME_MAP[st];
      const awardKey = `${h.key}:${stageName}`;

      if (!awardedSet.has(awardKey)) {
        awardedSet.add(awardKey);
        try {
          await db.$transaction(async (tx) => {
            await tx.habitStageAward.create({
              data: {
                userId,
                habitKey: h.key,
                stage: stageName,
                xp: HABIT_STAGE_XP[st],
              },
            });
            await awardXp(tx, userId, {
              source: "HABIT",
              amount: HABIT_STAGE_XP[st],
              refId: `${h.key}:${st}`,
            });
          });
        } catch {
          // Ignore unique constraint violation if concurrently inserted
        }
      }
    }
  }
}

export const realHabitRepo: HabitRepository = {
  async getOverview(userId: string): Promise<HabitsOverview> {
    const db = await getDb();
    await verifyUserExists(db, userId);

    const now = new Date();
    const coachNote = await realHabitRepo.getCoachNote(userId);
    const { categoryInfos, rawEvents } = await loadUserData(db, userId);

    const overview = analyzeHabits(rawEvents, categoryInfos, now, coachNote);

    // Award stage-up XP if any new stage was reached
    await awardNewStageXp(db, userId, overview);

    return overview;
  },

  async getDetail(userId: string, habitKey: string): Promise<HabitDetail> {
    const db = await getDb();
    await verifyUserExists(db, userId);

    const now = new Date();
    const { categoryInfos, rawEvents } = await loadUserData(db, userId);

    const detected = detectHabits(rawEvents, categoryInfos, now);
    const habit = detected.find((h) => h.key === habitKey);

    if (!habit) {
      throw new Error(`Habit not found: ${habitKey}`);
    }

    return buildHabitDetail(habit, rawEvents);
  },

  async getCoachNote(userId: string): Promise<CoachNote> {
    const db = await getDb();
    await verifyUserExists(db, userId);

    const now = new Date();
    const isoWeek = isoWeekKey(todayISO(now));

    // 1. Check cache in database
    const cached = await db.coachNote.findUnique({
      where: {
        userId_isoWeek: { userId, isoWeek },
      },
    });

    if (cached) {
      const rawLines = cached.text.split("\n");
      const lines: [string, string, string] = [
        rawLines[0] ?? "",
        rawLines[1] ?? "",
        rawLines[2] ?? "",
      ];
      return {
        isoWeek: cached.isoWeek,
        lines,
        source: cached.source as "ai" | "rules",
        generatedAt: cached.createdAt.toISOString(),
      };
    }

    // 2. Fallback rules note (TODO(Mayur): delegate to @/server/coach when built)
    const fallbackLines: [string, string, string] = [
      "Welcome to Shiftly. Your habits show up on their own.",
      "Finish a scenario on 3 different days and your first habit appears.",
      "Short and often beats long and rare. Five minutes counts.",
    ];

    try {
      const created = await db.coachNote.create({
        data: {
          userId,
          isoWeek,
          text: fallbackLines.join("\n"),
          source: "rules",
        },
      });

      return {
        isoWeek: created.isoWeek,
        lines: fallbackLines,
        source: "rules",
        generatedAt: created.createdAt.toISOString(),
      };
    } catch {
      // If inserted concurrently, re-read
      const existing = await db.coachNote.findUnique({
        where: { userId_isoWeek: { userId, isoWeek } },
      });
      if (existing) {
        const rawLines = existing.text.split("\n");
        return {
          isoWeek: existing.isoWeek,
          lines: [rawLines[0] ?? "", rawLines[1] ?? "", rawLines[2] ?? ""],
          source: existing.source as "ai" | "rules",
          generatedAt: existing.createdAt.toISOString(),
        };
      }

      return {
        isoWeek,
        lines: fallbackLines,
        source: "rules",
        generatedAt: now.toISOString(),
      };
    }
  },
};
