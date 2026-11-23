import "server-only";

import { db } from "@/server/db";
import { isoWeekKey } from "@/lib/habits";
import { todayISO } from "@/lib/time";
import type { CoachNote } from "@/lib/types";
import { summarizeActivity } from "./summary";
import { generateCoachNote } from "./ai";

// In-memory tracker for daily AI attempts: `${userId}:${todayISO}`
const dailyAiAttempts = new Set<string>();

export function resetCoachAttemptsForTests(): void {
  dailyAiAttempts.clear();
}

function hasAttemptedAiToday(userId: string, today: string): boolean {
  return dailyAiAttempts.has(`${userId}:${today}`);
}

function recordAiAttemptToday(userId: string, today: string): void {
  dailyAiAttempts.add(`${userId}:${today}`);
}

function splitLines(text: string): readonly [string, string, string] {
  const parts = text.split("\n");
  return [parts[0] ?? "", parts[1] ?? "", parts[2] ?? ""] as const;
}

/**
 * Retrieves or generates the 3-line weekly coach note for a user.
 *
 * Rules:
 * - Checks CoachNote row for (userId, current ISO week). If one exists with source "ai", return it.
 * - If none exists, or only a "rules" one: try AI (max one AI attempt per user per day).
 * - On AI success, upsert with source "ai".
 * - On AI failure, if no row exists, upsert the rules note. If a rules row already exists, keep it.
 * - An unknown user id is an error.
 */
export async function getCoachNote(userId: string): Promise<CoachNote> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  const now = new Date();
  const todayStr = todayISO(now);
  const currentIsoWeek = isoWeekKey(todayStr);

  const existing = await db.coachNote.findUnique({
    where: {
      userId_isoWeek: {
        userId,
        isoWeek: currentIsoWeek,
      },
    },
  });

  // 1. If an AI note is already cached, return it immediately
  if (existing && existing.source === "ai") {
    return {
      isoWeek: existing.isoWeek,
      lines: splitLines(existing.text),
      source: "ai",
      generatedAt: existing.createdAt.toISOString(),
    };
  }

  // 2. Check if an AI attempt was already made today
  const existingCreatedToday =
    existing && todayISO(existing.createdAt) === todayStr;
  const memoryAttemptedToday = hasAttemptedAiToday(userId, todayStr);

  if (existing && (existingCreatedToday || memoryAttemptedToday)) {
    // Attempt already used today; return the existing rules note without calling AI
    return {
      isoWeek: existing.isoWeek,
      lines: splitLines(existing.text),
      source: "rules",
      generatedAt: existing.createdAt.toISOString(),
    };
  }

  // 3. Mark attempt used today
  recordAiAttemptToday(userId, todayStr);

  // 4. Fetch the last 14 days of activity events (current week + previous week)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const events = await db.activityEvent.findMany({
    where: {
      userId,
      createdAt: { gte: twoWeeksAgo },
    },
    include: {
      category: {
        select: { slug: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const summary = summarizeActivity(events, now);
  const aiResult = await generateCoachNote(summary);

  if (aiResult.source === "ai") {
    // AI generation succeeded: upsert row with source "ai"
    const saved = await db.coachNote.upsert({
      where: {
        userId_isoWeek: {
          userId,
          isoWeek: currentIsoWeek,
        },
      },
      create: {
        userId,
        isoWeek: currentIsoWeek,
        text: aiResult.lines.join("\n"),
        source: "ai",
        createdAt: now,
      },
      update: {
        text: aiResult.lines.join("\n"),
        source: "ai",
        createdAt: now,
      },
    });

    return {
      isoWeek: saved.isoWeek,
      lines: aiResult.lines,
      source: "ai",
      generatedAt: saved.createdAt.toISOString(),
    };
  }

  // AI generation failed (or fell back to rules)
  if (existing) {
    // Update createdAt to now so subsequent calls today do not retry AI
    await db.coachNote.update({
      where: { id: existing.id },
      data: { createdAt: now },
    });

    return {
      isoWeek: existing.isoWeek,
      lines: splitLines(existing.text),
      source: "rules",
      generatedAt: existing.createdAt.toISOString(),
    };
  }

  // No existing row: save the rules note
  const saved = await db.coachNote.create({
    data: {
      userId,
      isoWeek: currentIsoWeek,
      text: aiResult.lines.join("\n"),
      source: "rules",
      createdAt: now,
    },
  });

  return {
    isoWeek: saved.isoWeek,
    lines: aiResult.lines,
    source: "rules",
    generatedAt: saved.createdAt.toISOString(),
  };
}
