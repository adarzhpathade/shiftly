import "server-only";

import { ActivityType, type Prisma } from "@/generated/prisma/client";
import { todayISO } from "@/lib/time";
import type { ActivityEventInput, ActivityRecordResult } from "@/lib/types";
import type { ActivityRepository } from "@/data/repositories";
import { progressQuests } from "@/server/progress/award";

async function getDb() {
  const { db } = await import("@/server/db");
  return db;
}

export interface ActivityRecordOptions {
  readonly categoryId?: string;
}

/**
 * Inserts one ActivityEvent inside an existing Prisma transaction.
 *
 * Rules:
 * - daily_open is stored at most once per user per Asia/Kolkata day.
 * - An unknown user id throws an error.
 * - stageUps: returns an empty list (stage-ups come from the habit analyzer).
 */
export async function recordActivity(
  tx: Prisma.TransactionClient,
  userId: string,
  event: ActivityEventInput & ActivityRecordOptions,
): Promise<ActivityRecordResult> {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  const atDate = event.at ? new Date(event.at) : new Date();

  if (event.type === "daily_open") {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;

    const dayStr = todayISO(atDate);
    const dayStart = new Date(`${dayStr}T00:00:00+05:30`);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const existing = await tx.activityEvent.findFirst({
      where: {
        userId,
        type: ActivityType.DAILY_OPEN,
        createdAt: {
          gte: dayStart,
          lt: dayEnd,
        },
      },
    });

    if (existing) {
      return { recorded: false, stageUps: [], xpEarned: 0 };
    }
  }

  let prismaType: ActivityType;
  switch (event.type) {
    case "training_finished":
      prismaType = ActivityType.TRAINING_FINISHED;
      break;
    case "boss_finished":
      prismaType = ActivityType.BOSS_FINISHED;
      break;
    case "daily_open":
      prismaType = ActivityType.DAILY_OPEN;
      break;
    case "quest_completed":
      prismaType = ActivityType.QUEST_COMPLETED;
      break;
    case "perfect_score":
      prismaType = ActivityType.PERFECT_SCORE;
      break;
    default:
      throw new Error(`Unknown activity event type: ${(event as { type: string }).type}`);
  }

  let categoryId: string | null = event.categoryId ?? null;
  if (!categoryId && "categoryKey" in event && event.categoryKey) {
    const cat = await tx.category.findUnique({
      where: { slug: event.categoryKey },
      select: { id: true },
    });
    categoryId = cat?.id ?? null;
  }

  let meta: Prisma.InputJsonValue | undefined = undefined;
  if (event.type === "boss_finished") {
    meta = { won: event.won };
  } else if (event.type === "quest_completed") {
    meta = { questId: event.questId };
  }

  await tx.activityEvent.create({
    data: {
      userId,
      type: prismaType,
      categoryId,
      stars: "stars" in event ? event.stars : (event.type === "perfect_score" ? 3 : null),
      meta: meta ?? undefined,
      createdAt: atDate,
    },
  });

  if (event.type === "daily_open") {
    await progressQuests(tx, userId, "habit");
  }

  // TODO(habits): stage-ups come from the habit analyzer
  return {
    recorded: true,
    stageUps: [],
    xpEarned: 0,
  };
}

export const realActivityRepo: ActivityRepository = {
  async record(userId: string, event: ActivityEventInput): Promise<ActivityRecordResult> {
    const db = await getDb();
    return await db.$transaction(async (tx) => {
      return await recordActivity(tx, userId, event);
    });
  },
};
