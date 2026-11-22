"use server";

import { bossRepo } from "@/data";
import { requireViewer } from "@/server/auth/session";
import type { CategoryKey } from "@/lib/types";
import type {
  StartBossActionResult,
  GetBossSessionActionResult,
  FinishBossActionResult,
} from "./types";

export async function startBossAction(categoryKey: string): Promise<StartBossActionResult> {
  try {
    const viewer = await requireViewer();
    const result = await bossRepo.startSession(viewer.id, categoryKey as CategoryKey);
    return { ok: true, result };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to start boss session",
    };
  }
}

export async function getBossSessionAction(sessionId: string): Promise<GetBossSessionActionResult> {
  try {
    const viewer = await requireViewer();
    const session = await bossRepo.getSession(viewer.id, sessionId);
    return { ok: true, session };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to get boss session",
    };
  }
}

export async function finishBossAction(sessionId: string): Promise<FinishBossActionResult> {
  try {
    const viewer = await requireViewer();
    const result = await bossRepo.finishSession(viewer.id, sessionId);
    return { ok: true, result };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to finish boss session",
    };
  }
}
