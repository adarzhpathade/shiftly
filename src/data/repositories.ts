/**
 * Repository interfaces: the contract between screens (via route files and
 * server actions) and data. Mock and real implementations both satisfy these.
 * Pure TypeScript: no React or Next imports.
 *
 * Every method is async and receives the acting `userId` first where relevant
 * (the route file gets it from the session).
 */
import type {
  AnswerResult,
  AttemptStart,
  BossResult,
  BossSession,
  BossStartResult,
  BossStreamEvent,
  Category,
  CategoryKey,
  CheckInResult,
  Badge,
  GuidedScenario,
  Habit,
  HabitDetail,
  HabitInput,
  HabitTemplate,
  HomeData,
  Leaderboard,
  LeaderboardPeriod,
  LeaderboardScope,
  LevelNode,
  Quest,
  ScenarioResult,
  UserProfile,
} from "@/lib/types";

export interface HomeRepository {
  getHome(userId: string): Promise<HomeData>;
}

/**
 * Guided scenario flow:
 *   getGuidedScenario(id)            -> show the situation (no ratings leak)
 *   startAttempt(userId, id)         -> { attemptId, firstStepId }
 *   answerStep(userId, attemptId, stepId, choiceId) -> rating + feedback + nextStepId
 *       (repeat until nextStepId is null)
 *   finishAttempt(userId, attemptId) -> score, stars, XP, per-step feedback
 */
export interface TrainingRepository {
  listCategories(userId: string): Promise<readonly Category[]>;
  getLevelPath(userId: string, categoryKey: CategoryKey): Promise<readonly LevelNode[]>;
  getGuidedScenario(scenarioId: string): Promise<GuidedScenario>;
  startAttempt(userId: string, scenarioId: string): Promise<AttemptStart>;
  answerStep(userId: string, attemptId: string, stepId: string, choiceId: string): Promise<AnswerResult>;
  finishAttempt(userId: string, attemptId: string): Promise<ScenarioResult>;
}

/**
 * Boss flow:
 *   startSession(userId, categoryKey) -> { ok: true, session, attemptsLeftToday } or
 *       { ok: false, reason: 'daily-limit', resetsAt } (BOSS_DAILY_LIMIT per day)
 *   sendMessage(userId, sessionId, text) -> stream: many `token` events, then one
 *       `turn` event (mood + scores + status), or an `error` event (fallback = true
 *       means the session is now status 'fallback': play session.fallbackScenarioId instead;
 *       replies over MAX_REPLY_CHARS give an error with fallback: false)
 *   finishSession(userId, sessionId) -> result screen data
 */
export interface BossRepository {
  startSession(userId: string, categoryKey: CategoryKey): Promise<BossStartResult>;
  getSession(userId: string, sessionId: string): Promise<BossSession>;
  sendMessage(userId: string, sessionId: string, text: string): AsyncIterable<BossStreamEvent>;
  finishSession(userId: string, sessionId: string): Promise<BossResult>;
}

export interface HabitRepository {
  /** The user's active habits with today's state. */
  listToday(userId: string): Promise<readonly Habit[]>;
  listTemplates(): Promise<readonly HabitTemplate[]>;
  create(userId: string, input: HabitInput): Promise<Habit>;
  update(userId: string, habitId: string, patch: Partial<HabitInput>): Promise<Habit>;
  remove(userId: string, habitId: string): Promise<void>;
  /** Idempotent per day: a second call the same day returns xpEarned 0. */
  checkIn(userId: string, habitId: string, note?: string): Promise<CheckInResult>;
  getDetail(userId: string, habitId: string): Promise<HabitDetail>;
}

export interface GamificationRepository {
  getProfile(userId: string): Promise<UserProfile>;
  /** All badges, earned and locked. */
  listBadges(userId: string): Promise<readonly Badge[]>;
  listQuests(userId: string): Promise<readonly Quest[]>;
}

export interface LeaderboardRepository {
  get(userId: string, scope: LeaderboardScope, period: LeaderboardPeriod): Promise<Leaderboard>;
}
