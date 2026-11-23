import "server-only";

import type {
  ActivityRepository,
  BossRepository,
  GamificationRepository,
  HabitRepository,
  HomeRepository,
  LeaderboardRepository,
  PasswordResetRepository,
  TrainingRepository,
} from "./repositories";
import {
  mockActivityRepo,
  mockBossRepo,
  mockGamificationRepo,
  mockHabitRepo,
  mockHomeRepo,
  mockLeaderboardRepo,
  mockPasswordResetRepo,
  mockTrainingRepo,
} from "./mock";
import { getAiMode } from "@/server/boss/mode";
import { realGamificationRepo } from "@/server/gamification/repository";
import { realLeaderboardRepo } from "@/server/leaderboard/repository";
import { realTrainingRepo } from "@/server/training/repository";
import { realHomeRepo } from "@/server/home/repository";
import { realActivityRepo } from "@/server/activity/repository";

/**
 * The active data implementations. Server-side only: use them in route files
 * and server actions, never in client components.
 *
 * DATA_SOURCE = 'mock' (default) | 'real'
 *
 * TODO(backend): when a real implementation exists (src/server/<domain>/),
 * import it here and pick it when source === 'real', per repository, e.g.
 *   export const habitRepo: HabitRepository = source === "real" ? realHabitRepo : mockHabitRepo;
 */
const source = process.env.DATA_SOURCE ?? "mock";

if (source === "real") {
  console.warn("[data] DATA_SOURCE=real: habits, activity and password reset still use mocks (not built yet).");
}

export const homeRepo: HomeRepository = source === "real" ? realHomeRepo : mockHomeRepo;
export const trainingRepo: TrainingRepository = source === "real" ? realTrainingRepo : mockTrainingRepo;
/** The real boss repo needs the DB, so it is imported lazily: importing "@/data" never requires DATABASE_URL. */
const useRealBoss = source === "real" || getAiMode() === "real";
const lazyReal = () => import("@/server/boss/repo").then((m) => m.realBossRepo);
const lazyBossRepo: BossRepository = {
  startSession: async (u, c) => (await lazyReal()).startSession(u, c),
  getSession: async (u, id) => (await lazyReal()).getSession(u, id),
  async *sendMessage(u, id, text) {
    yield* (await lazyReal()).sendMessage(u, id, text);
  },
  finishSession: async (u, id) => (await lazyReal()).finishSession(u, id),
};
export const bossRepo: BossRepository = useRealBoss ? lazyBossRepo : mockBossRepo;

/**
 * Auto-habits (docs/contract-auto-habits.md). No real implementations exist yet, so BOTH sources
 * use the mocks for these three until the owners finish:
 *   habitRepo          TODO(Khushi): src/server/habits/ (detection from ActivityEvent)
 *   activityRepo       TODO(Mayur):  src/server/activity/
 *   passwordResetRepo  TODO(Mayur):  src/server/auth/ (reset codes + Gmail SMTP)
 * When one is ready: `source === "real" ? realXRepo : mockXRepo`. getCoachNote belongs to Mayur
 * (AI + cache) but is part of habitRepo, so he plugs it into Khushi's repo.
 */
export const habitRepo: HabitRepository = mockHabitRepo;
export const activityRepo: ActivityRepository = source === "real" ? realActivityRepo : mockActivityRepo;
export const passwordResetRepo: PasswordResetRepository = mockPasswordResetRepo;
export const gamificationRepo: GamificationRepository = source === "real" ? realGamificationRepo : mockGamificationRepo;
export const leaderboardRepo: LeaderboardRepository = source === "real" ? realLeaderboardRepo : mockLeaderboardRepo;

export type * from "./repositories";
