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
  console.warn("[data] DATA_SOURCE=real but no real repositories exist yet. Falling back to mocks.");
}

export const homeRepo: HomeRepository = mockHomeRepo;
export const trainingRepo: TrainingRepository = mockTrainingRepo;
export const bossRepo: BossRepository = mockBossRepo;
export const habitRepo: HabitRepository = mockHabitRepo;
export const gamificationRepo: GamificationRepository = mockGamificationRepo;
export const leaderboardRepo: LeaderboardRepository = mockLeaderboardRepo;

export type * from "./repositories";
