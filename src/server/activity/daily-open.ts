import "server-only";

import type { ActivityRecordResult } from "@/lib/types";
import { realActivityRepo } from "./repository";

/**
 * Records the user's daily open ("clock in") event for today.
 * Stored at most once per user per Asia/Kolkata day.
 */
export async function recordDailyOpen(userId: string): Promise<ActivityRecordResult> {
  return await realActivityRepo.record(userId, { type: "daily_open" });
}
