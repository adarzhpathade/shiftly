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
  ActivityEventInput,
  ActivityRecordResult,
  Badge,
  CoachNote,
  GuidedScenario,
  HabitDetail,
  HabitsOverview,
  HomeData,
  Leaderboard,
  LeaderboardPeriod,
  LeaderboardScope,
  LevelNode,
  PasswordResetRequestResult,
  PasswordResetVerifyResult,
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

/**
 * Habits are detected automatically; users never create, edit or check in habits.
 * Flow (Habits page):
 *   getOverview(userId)  -> everything the page shows in one call: detected habits
 *       (on_track or slipping, never fading), the next habit to form, insights, the
 *       weekly coach note, and `firstHabits` progress while the user has no habit yet.
 *   getDetail(userId, habitKey) -> one habit with weekly counts and recent activity.
 *       Also works for fading habits. Unknown key -> throws "Habit not found".
 *   getCoachNote(userId) -> the 3-line note for the current ISO week. Generated once per
 *       user per week (AI, with a rules-based fallback) and cached; later calls return the cache.
 * Habits are COMPUTED from ActivityEvent rows on read: nothing to write from the screens.
 * Rules and thresholds: docs/contract-auto-habits.md.
 */
export interface HabitRepository {
  getOverview(userId: string): Promise<HabitsOverview>;
  getDetail(userId: string, habitKey: string): Promise<HabitDetail>;
  getCoachNote(userId: string): Promise<CoachNote>;
}

/**
 * Activity flow (INTERNAL: server code only, never called from a client component):
 *   record(userId, event) is called by
 *     - training: finishAttempt        -> training_finished (+ perfect_score on 3 stars)
 *     - boss:     finishSession        -> boss_finished
 *     - progress: a quest completes    -> quest_completed
 *     - the app shell: first open of the day (a server action fired by the layout) -> daily_open
 *   It stores the event, re-detects the habits the event can affect, and pays the small XP
 *   bonus once when a habit reaches a new stage (HabitStageAward). The result carries
 *   `stageUps` so the caller can add them to the celebrations it already returns.
 *   It must never throw into the caller's flow: log and return { recorded: false, ... }.
 */
export interface ActivityRepository {
  record(userId: string, event: ActivityEventInput): Promise<ActivityRecordResult>;
}

/**
 * Forgot-password flow (email code):
 *   requestCode(email) -> emails a 6-digit code (Gmail SMTP). ALWAYS { ok: true } for any
 *       well-formed email (never reveals whether an account exists), unless the email hit
 *       the limit of 3 requests per hour ({ ok: false, reason: 'rate-limited' }, applied
 *       the same way to unknown emails) or is malformed ('invalid').
 *   verifyAndReset(email, code, newPassword) -> checks the code and sets the new password.
 *       ok | invalid (wrong code, unknown email, weak password; `field` says which) |
 *       expired (older than 15 min) | too-many-tries (5 wrong guesses burn the code) |
 *       rate-limited. The code is stored hashed, single use. After `ok` the user logs in
 *       normally: the screen sends them to /login.
 */
export interface PasswordResetRepository {
  requestCode(email: string): Promise<PasswordResetRequestResult>;
  verifyAndReset(email: string, code: string, newPassword: string): Promise<PasswordResetVerifyResult>;
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
