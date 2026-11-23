/**
 * Mock ActivityRepository: records events into the in-memory state and reports no stage-ups
 * (the mock habits are fixed demo data, not computed from these events).
 *
 * TODO(Mayur): real ActivityRepository in src/server/activity/ (ActivityEvent table, re-detect
 * affected habits, pay HabitStageAward XP once), wired in src/data/index.ts.
 */
import { todayISO } from "@/lib/time";
import type { ActivityRepository } from "../repositories";
import { ME_ID, bumpQuests, resolveUser, state } from "./state";

export const mockActivityRepo: ActivityRepository = {
  async record(userId, event) {
    const uid = resolveUser(userId);
    const at = event.at ?? new Date().toISOString();
    if (event.type === "daily_open") {
      const day = todayISO(new Date(at));
      const already = state.activity.some(
        (a) => a.userId === uid && a.event.type === "daily_open" && todayISO(new Date(a.at)) === day,
      );
      if (already) return { recorded: false, stageUps: [], xpEarned: 0 };
    }
    state.activity.push({ userId: uid, event, at });
    // Clocking in advances the "Clock in today" quest for the demo user.
    if (event.type === "daily_open" && uid === ME_ID) bumpQuests("habit");
    return { recorded: true, stageUps: [], xpEarned: 0 };
  },
};
