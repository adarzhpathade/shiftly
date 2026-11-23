import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { Quest, QuestType } from "@/lib/types";
import { todayISO } from "@/lib/time";

export interface QuestDef {
  readonly type: QuestType;
  readonly label: string;
  readonly target: number;
  readonly xpReward: number;
}

export const QUEST_DEFS: readonly QuestDef[] = [
  { type: "scenario", label: "Finish 1 scenario", target: 1, xpReward: 30 },
  { type: "habit", label: "Clock in today", target: 1, xpReward: 20 },
  { type: "stars", label: "Score 2 stars or more", target: 1, xpReward: 25 },
] as const;

export function getTodayDateForDb(dateStr: string = todayISO()): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export function toQuest(row: {
  id: string;
  type: string;
  target: number;
  progress: number;
  completed: boolean;
}): Quest {
  const def = QUEST_DEFS.find((d) => d.type === row.type);
  return {
    id: row.id,
    type: row.type as QuestType,
    label: def?.label ?? row.type,
    target: row.target,
    progress: row.progress,
    completed: row.completed,
    xpReward: def?.xpReward ?? 0,
  };
}

const QUEST_ORDER: Record<string, number> = {
  scenario: 0,
  habit: 1,
  stars: 2,
};

/**
 * Ensures today's three DailyQuest rows (date = today in Asia/Kolkata) exist for the user.
 * Creates any missing rows and returns all three quests in standard order.
 */
export async function ensureTodayQuests(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<Quest[]> {
  const todayDate = getTodayDateForDb();

  const existing = await tx.dailyQuest.findMany({
    where: {
      userId,
      date: todayDate,
    },
    orderBy: { createdAt: "asc" },
  });

  const existingTypes = new Set(existing.map((q) => q.type));
  const missingDefs = QUEST_DEFS.filter((def) => !existingTypes.has(def.type));

  if (missingDefs.length > 0) {
    for (const def of missingDefs) {
      const created = await tx.dailyQuest.create({
        data: {
          userId,
          date: todayDate,
          type: def.type,
          target: def.target,
          progress: 0,
          completed: false,
        },
      });
      existing.push(created);
    }
  }

  existing.sort((a, b) => (QUEST_ORDER[a.type] ?? 99) - (QUEST_ORDER[b.type] ?? 99));

  return existing.map(toQuest);
}
