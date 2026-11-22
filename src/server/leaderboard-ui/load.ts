import type { Leaderboard, LeaderboardPeriod, LeaderboardScope } from "@/lib/types";
import { leaderboardRepo } from "@/data";
import { parseLeaderboardParams, type LeaderboardParamsInput } from "./params";
import { msUntilWeekReset } from "./week-reset";

export interface LeaderboardView {
  leaderboard: Leaderboard;
  scope: LeaderboardScope;
  period: LeaderboardPeriod;
  resetsInMs: number | null;
}

export async function loadLeaderboardView(
  viewerId: string,
  raw?: LeaderboardParamsInput | null,
  now?: Date,
): Promise<LeaderboardView> {
  const { scope, period } = parseLeaderboardParams(raw);
  const leaderboard = await leaderboardRepo.get(viewerId, scope, period);
  const resetsInMs = period === "week" ? msUntilWeekReset(now) : null;

  return {
    leaderboard,
    scope,
    period,
    resetsInMs,
  };
}
