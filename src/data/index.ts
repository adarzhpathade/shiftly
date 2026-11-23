import "server-only";

import type {
  BossRepository,
  GamificationRepository,
  HabitRepository,
  HomeRepository,
  LeaderboardRepository,
  TrainingRepository,
} from "./repositories";
import {
  mockBossRepo,
  mockGamificationRepo,
  mockHabitRepo,
  mockHomeRepo,
  mockLeaderboardRepo,
  mockTrainingRepo,
} from "./mock";
import { getAiMode } from "@/server/boss/mode";
import { realLeaderboardRepo } from "@/server/leaderboard/repository";

/**
 * The active data implementations. Server-side only: use them in route files
 * and server actions, never in client components.
 *
 * DATA_SOURCE = 'mock' (default) | 'real'
 *
 * TODO(backend): when a real implementation exists (src/server/<domain>/),
 * import it here and pick it when source === 'real', per repository, e.g.
 *   export const habitRepo: HabitRepository = source === "real" ? realHabitRepo : mockHabitRepo;
 * Until then 'real' falls back to the mocks with a warning.
 */
const source = process.env.DATA_SOURCE ?? "mock";

if (source === "real") {
  console.warn("[data] DATA_SOURCE=real but no real repositories exist yet (non-boss). Falling back to mocks.");
}

export const homeRepo: HomeRepository = mockHomeRepo;
export const trainingRepo: TrainingRepository = mockTrainingRepo;
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
export const habitRepo: HabitRepository = mockHabitRepo;
export const gamificationRepo: GamificationRepository = mockGamificationRepo;
export const leaderboardRepo: LeaderboardRepository = source === "real" ? realLeaderboardRepo : mockLeaderboardRepo;

export type * from "./repositories";
