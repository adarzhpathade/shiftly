"use server";

import { revalidatePath } from "next/cache";
import { habitRepo } from "@/data";
import { buildCelebrations } from "@/lib/celebrations";
import { requireViewer } from "@/server/auth/session";
import type { CheckInActionResult } from "./types";

export async function checkInHabitAction(
  habitId: string
): Promise<CheckInActionResult> {
  try {
    const viewer = await requireViewer();
    const result = await habitRepo.checkIn(viewer.id, habitId);
    revalidatePath("/");
    return {
      ok: true,
      xpEarned: result.xpEarned,
      streak: result.streak,
      ...(result.leveledUp ? { leveledUp: result.leveledUp.newLevel } : {}),
      celebrations: buildCelebrations(result),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to check in habit",
    };
  }
}
