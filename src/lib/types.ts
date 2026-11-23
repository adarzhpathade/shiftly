/**
 * Domain view-model types: what the UI needs, not database rows.
 * Dates are ISO strings ("YYYY-MM-DD" for days, full ISO for timestamps).
 * Colours are token names ('peach', ...), never CSS values.
 * Pure TypeScript: no React or Next imports. Shared by frontend and backend.
 */
import type { Stars } from "./gamification";

export type { Stars } from "./gamification";

// ---------- Users ----------

export type Role = "employee" | "manager" | "admin";

export interface UserSummary {
  readonly id: string;
  readonly name: string;
  readonly avatarKey: string;
  readonly teamName: string;
  readonly level: number;
  readonly xp: number;
}

export interface UserStats {
  readonly scenariosCompleted: number;
  readonly perfectScores: number;
  /** DEPRECATED: manual check-ins are gone. Kept for the live site; 0 for new users. */
  readonly habitCheckIns: number;
  readonly bossWins?: number;
  /** Average scenario score, 0 to 100. */
  readonly averageScore: number;
  readonly scoreHistory: readonly { readonly date: string; readonly score: number }[];
  readonly categoryMastery: readonly { readonly categoryKey: CategoryKey; readonly mastery: number }[];
}

export interface UserProfile extends UserSummary {
  readonly role: Role;
  readonly email: string;
  readonly currentStreak: number;
  readonly bestStreak: number;
  /** XP earned since reaching the current level. */
  readonly xpIntoLevel: number;
  /** Size of the current level in XP. */
  readonly xpForNext: number;
  readonly xpToNext: number;
  readonly badges: readonly Badge[];
  readonly stats: UserStats;
}

// ---------- Training ----------

export type CategoryKey = "handling-complaints" | "customer-queries" | "difficult-customers" | "problem-solving";
export type ColorToken = "peach" | "sky" | "lav" | "lime";
export type Difficulty = "beginner" | "intermediate";
export type Rating = "best" | "okay" | "poor";

export interface CategoryProgress {
  readonly completedLevels: number;
  readonly totalLevels: number;
  readonly stars: number;
  readonly maxStars: number;
  /** 0 to 1, drives the mastery ring. */
  readonly mastery: number;
}

export interface Category {
  readonly key: CategoryKey;
  readonly name: string;
  readonly colorToken: ColorToken;
  /** Hero 3D object key, e.g. 'megaphone'. */
  readonly objectKey: string;
  readonly description: string;
  readonly progress: CategoryProgress;
}

export type LevelKind = "guided" | "boss";

export interface LevelNode {
  /** 1 to 5. Level 5 is the boss. */
  readonly level: 1 | 2 | 3 | 4 | 5;
  readonly kind: LevelKind;
  readonly title: string;
  readonly stars: Stars;
  readonly locked: boolean;
  /** Guided levels: the scenario to open. Null for the boss. */
  readonly scenarioId: string | null;
}

export interface ScenarioSummary {
  readonly id: string;
  readonly title: string;
  readonly categoryKey: CategoryKey;
  readonly difficulty: Difficulty;
  readonly stepCount: number;
  readonly xpReward: number;
}

export interface ScenarioCustomer {
  readonly name: string;
  readonly avatarKey: string;
}

/** A choice as the player sees it: no rating, points or feedback (those come after answering). */
export interface ScenarioChoice {
  readonly id: string;
  readonly text: string;
}

export interface ScenarioStep {
  readonly id: string;
  readonly customerMessage: string;
  readonly choices: readonly ScenarioChoice[];
}

export interface GuidedScenario extends ScenarioSummary {
  readonly situation: string;
  readonly customer: ScenarioCustomer;
  readonly steps: readonly ScenarioStep[];
}

/** Returned by startAttempt. */
export interface AttemptStart {
  readonly attemptId: string;
  readonly scenarioId: string;
  readonly firstStepId: string;
}

export interface AnswerResult {
  readonly rating: Rating;
  readonly points: number;
  readonly maxPoints: number;
  readonly feedback: string;
  /** The next step to show, or null when the scenario is finished. */
  readonly nextStepId: string | null;
}

export interface StepFeedback {
  readonly stepId: string;
  readonly customerMessage: string;
  readonly choiceText: string;
  readonly rating: Rating;
  readonly points: number;
  readonly feedback: string;
}

export interface ScenarioResult {
  readonly attemptId: string;
  readonly scenarioId: string;
  readonly categoryKey: CategoryKey;
  readonly score: number;
  readonly maxScore: number;
  readonly stars: Stars;
  readonly bestStars: Stars;
  readonly xpEarned: number;
  readonly perStep: readonly StepFeedback[];
  readonly leveledUp?: { readonly newLevel: number };
  readonly newBadges: readonly Badge[];
  /** Scenario to open for "Next", or null. */
  readonly nextScenarioId: string | null;
  /** Quests this attempt completed. Their XP is already granted (not in xpEarned). */
  readonly questsCompleted: readonly Quest[];
}

// ---------- Boss level ----------

export type BossStatus = "active" | "won" | "lost" | "fallback";

export interface BossPersona {
  readonly id: string;
  readonly categoryKey: CategoryKey;
  readonly name: string;
  readonly problem: string;
  readonly avatarKey: string;
  /** 0 (furious) to 100 (delighted). */
  readonly startMood: number;
}

export interface BossMessage {
  readonly role: "customer" | "user";
  readonly text: string;
}

export interface BossSession {
  readonly id: string;
  readonly persona: BossPersona;
  /** 0 to 100. */
  readonly mood: number;
  /** Replies the user has sent so far. */
  readonly turn: number;
  readonly maxTurns: 8;
  readonly status: BossStatus;
  readonly messages: readonly BossMessage[];
  /** Suggested quick-reply chips. */
  readonly quickReplies: readonly string[];
  /** Set when status is 'fallback': the guided (multiple-choice) scenario to play instead. */
  readonly fallbackScenarioId: string | null;
}

export type BossStartResult =
  | { readonly ok: true; readonly session: BossSession; readonly attemptsLeftToday: number }
  | { readonly ok: false; readonly reason: "daily-limit"; readonly resetsAt: string };

/** Each 0 to 10. */
export interface TurnScores {
  readonly empathy: number;
  readonly ownership: number;
  readonly clarity: number;
  readonly solution: number;
  readonly tone: number;
}

export type BossStreamEvent =
  | { readonly type: "token"; readonly text: string }
  | {
      readonly type: "turn";
      readonly moodAfter: number;
      readonly scores: TurnScores;
      readonly status: BossStatus;
      /** Optional coaching feedback from the AI judge. */
      readonly feedback?: string;
    }
  | { readonly type: "error"; readonly message: string; readonly fallback: boolean };

export interface BossResult {
  readonly sessionId: string;
  readonly categoryKey: CategoryKey;
  readonly status: BossStatus;
  readonly stars: Stars;
  readonly xpEarned: number;
  readonly averageScores: TurnScores;
  readonly weakestReply: { readonly text: string; readonly betterReply: string } | null;
  readonly leveledUp?: { readonly newLevel: number };
  readonly newBadges: readonly Badge[];
  /** Quests this call completed. Their XP is already granted (not in xpEarned). */
  readonly questsCompleted: readonly Quest[];
}

// ---------- Habits (detected automatically) ----------
//
// Users never create or check in habits. The app logs what they do (ActivityEvent)
// and DISCOVERS habits from repeating behaviour. Rules: docs/contract-auto-habits.md.

/** The behaviours that can become a habit. */
export type HabitKind =
  /** Finishes any training scenario. */
  | "trains"
  /** Finishes scenarios of one category (the key carries the category). */
  | "plays-category"
  /** Opens the app: "clocks in". */
  | "clocks-in"
  /** Plays boss levels. */
  | "boss-fights"
  /** Completes daily quests. */
  | "completes-quests"
  /** Gets 3-star (perfect) scores. */
  | "perfect-scores";

/** Part of the day, in the app timezone (hours in DAY_PARTS, src/lib/habits.ts). */
export type DayPart = "morning" | "afternoon" | "evening" | "night";

/** How established a habit is: forming (new) -> building -> solid. */
export type HabitStage = "forming" | "building" | "solid";

/** How a habit is doing right now. "fading" habits are hidden from the main list. */
export type HabitStatus = "on_track" | "slipping" | "fading";

/** When the user usually does the behaviour. */
export interface HabitWindow {
  /** The day part that holds most occurrences. */
  readonly part: DayPart;
  /** Window start hour, 0 to 23 (inclusive), app timezone. */
  readonly startHour: number;
  /** Window end hour, 0 to 23 (exclusive), app timezone. */
  readonly endHour: number;
}

/** One heatmap cell. */
export interface HabitHeatCell {
  /** "YYYY-MM-DD". */
  readonly date: string;
  /** Times the behaviour happened that day (0 = not seen). */
  readonly count: number;
}

/** A habit the app discovered from the user's behaviour. */
export interface DetectedHabit {
  /** Stable id: the kind, or "plays-category:<categoryKey>". Used in URLs and getDetail. */
  readonly key: string;
  readonly kind: HabitKind;
  /** Set for "plays-category" habits, otherwise null. */
  readonly categoryKey: CategoryKey | null;
  /** Short headline, e.g. "Trains on weekday evenings". */
  readonly title: string;
  /** One friendly sentence about the pattern, e.g. "You finished 6 scenarios in the last 14 days." */
  readonly description: string;
  /** A habit icon key (src/lib/habit-icons.ts), e.g. 'clock'. */
  readonly icon: string;
  /** Weekdays the behaviour usually happens, 1 (Mon) to 7 (Sun). */
  readonly usualDays: readonly number[];
  /** The usual time window, or null when the user does it at no fixed time. */
  readonly usualWindow: HabitWindow | null;
  readonly stage: HabitStage;
  readonly status: HabitStatus;
  /** Consecutive usual days the behaviour was seen (non-usual days never break it). */
  readonly currentStreak: number;
  readonly bestStreak: number;
  /** 0 to 1: usual days hit / usual days over the last 4 weeks. */
  readonly consistency: number;
  /** True when the behaviour was already seen today. */
  readonly doneToday: boolean;
  /** Last 12 weeks (84 days), oldest first. */
  readonly heatmap: readonly HabitHeatCell[];
  /** ISO timestamp of the last occurrence. */
  readonly lastSeenAt: string;
}

/** One habit as one line on Home. */
export interface HabitSummary {
  readonly key: string;
  readonly title: string;
  readonly icon: string;
  readonly stage: HabitStage;
  readonly status: HabitStatus;
  readonly currentStreak: number;
  readonly doneToday: boolean;
}

/** What Home shows about habits (replaces the old "today's habits" list). */
export interface HomeHabits {
  /** Up to 3 habits that are on_track or slipping, slipping first. */
  readonly items: readonly HabitSummary[];
  /** 0 to 1 while the user has no habit yet (the "first habits forming" bar), otherwise null. */
  readonly firstHabitsProgress: number | null;
  /** How many habits are slipping (for a gentle nudge). */
  readonly slippingCount: number;
}

/** The one habit the app suggests next, from the user's weakest training category. */
export interface NextHabitSuggestion {
  readonly kind: HabitKind;
  readonly categoryKey: CategoryKey;
  /** e.g. "Play Difficult Customers Mon/Wed/Fri". */
  readonly title: string;
  /** Why this one, e.g. "It is your weakest category. A little practice here lifts your overall score." */
  readonly reason: string;
  readonly icon: string;
  /** Suggested weekdays, 1 (Mon) to 7 (Sun). */
  readonly suggestedDays: readonly number[];
  /** Distinct days with this behaviour in the last 14 days. */
  readonly occurrences: number;
  /** Occurrences needed to form the habit (3). */
  readonly needed: number;
  /** 0 to 1 progress toward forming: occurrences / needed. */
  readonly progress: number;
}

/** Progress for users with no habit yet, so the page is never blank. */
export interface FirstHabitsProgress {
  /** 0 to 1: the best repeating behaviour so far, distinct days / 3 (capped at 1). */
  readonly progress: number;
  /** Distinct days of the best candidate behaviour in the last 14 days. */
  readonly occurrences: number;
  readonly needed: number;
  /** Friendly line, e.g. "Finish 2 more scenarios this week and your first habit appears." */
  readonly hint: string;
}

/** Each insight is null when there is too little data. */
export interface HabitInsights {
  /** The day part where the user does most of their training. */
  readonly bestTimeOfDay: { readonly part: DayPart; readonly text: string } | null;
  /** The weekday the user most often skips. */
  readonly mostSkippedWeekday: { readonly isoWeekday: number; readonly text: string } | null;
  /** Link between a habit and scores, e.g. morning training scores 12% higher. */
  readonly skillLink: { readonly liftPercent: number; readonly text: string } | null;
  /** Nudge for a habit whose streak is about to break. */
  readonly streakAtRisk: { readonly habitKey: string; readonly text: string } | null;
}

/** The weekly coach note: 3 short lines. */
export interface CoachNote {
  /** ISO week the note belongs to, e.g. "2026-W47". */
  readonly isoWeek: string;
  /** Exactly 3 short lines (each about 90 characters or less). */
  readonly lines: readonly [string, string, string];
  /** "ai" = written by the model, "rules" = plain fallback text. */
  readonly source: "ai" | "rules";
  /** ISO timestamp when it was written. */
  readonly generatedAt: string;
}

/** Everything the Habits page needs, in one call. */
export interface HabitsOverview {
  /** Detected habits that are on_track or slipping, best stage first. Never contains "fading" ones. */
  readonly habits: readonly DetectedHabit[];
  /** Habits hidden because they are fading (so the page can offer "N faded habits"). */
  readonly fadingCount: number;
  /** The next habit to form, or null when the user has no training data yet. */
  readonly nextHabit: NextHabitSuggestion | null;
  readonly insights: HabitInsights;
  readonly coachNote: CoachNote;
  /** Set only while `habits` is empty, otherwise null. */
  readonly firstHabits: FirstHabitsProgress | null;
}

/** One logged moment in a habit's history. */
export interface HabitOccurrence {
  /** ISO timestamp. */
  readonly at: string;
  /** e.g. "Finished Late Delivery, 3 stars". */
  readonly label: string;
}

/** One habit with the extra detail for its own page. Works for fading habits too. */
export interface HabitDetail extends DetectedHabit {
  /** Occurrences per week for the last 12 weeks, oldest first. */
  readonly weeklyCounts: readonly { readonly weekStart: string; readonly count: number }[];
  /** Latest occurrences, newest first (about 10). */
  readonly recent: readonly HabitOccurrence[];
  /** Plain explanation of why it is slipping or fading, or null when on track. */
  readonly statusNote: string | null;
  /** Progress toward the next stage, or null when already solid. */
  readonly nextStage: { readonly stage: HabitStage; readonly progress: number; readonly hint: string } | null;
}

// ---------- Activity (feeds habit detection) ----------

/** The behaviours the app logs automatically. */
export type ActivityEventType =
  | "training_finished"
  | "boss_finished"
  | "daily_open"
  | "quest_completed"
  | "perfect_score";

/** One thing the user did. `at` defaults to now; pass it only for backfills and tests. */
export type ActivityEventInput =
  | { readonly type: "training_finished"; readonly categoryKey: CategoryKey; readonly stars: Stars; readonly at?: string }
  | { readonly type: "boss_finished"; readonly categoryKey: CategoryKey; readonly won: boolean; readonly stars: Stars; readonly at?: string }
  /** "Clocked in": the first app open of the day. Only the first per day is stored. */
  | { readonly type: "daily_open"; readonly at?: string }
  | { readonly type: "quest_completed"; readonly questId: string; readonly at?: string }
  | { readonly type: "perfect_score"; readonly categoryKey: CategoryKey; readonly at?: string };

/** A habit that just reached a new stage. */
export interface HabitStageUp {
  readonly habitKey: string;
  readonly title: string;
  readonly stage: HabitStage;
  /** Small XP bonus, already granted (paid once per habit and stage). */
  readonly xpBonus: number;
}

/** Returned by ActivityRepository.record. */
export interface ActivityRecordResult {
  /** False when the event was skipped (for example a second daily_open the same day). */
  readonly recorded: boolean;
  /** Habits that reached a new stage because of this event. Show a celebration for each. */
  readonly stageUps: readonly HabitStageUp[];
  /** Total stage XP granted by this call (sum of stageUps xpBonus). */
  readonly xpEarned: number;
  /** Set when the bonus XP caused a level-up. */
  readonly leveledUp?: { readonly newLevel: number };
}

// ---------- Password reset ----------

export type PasswordResetField = "email" | "code" | "newPassword";

/** requestCode never reveals whether the account exists: unknown emails also get `ok`. */
export type PasswordResetRequestResult =
  | { readonly ok: true }
  /** The email is not a valid address. */
  | { readonly ok: false; readonly reason: "invalid"; readonly field: "email"; readonly message: string }
  /** More than 3 requests for this email in the last hour (also applied to unknown emails). */
  | { readonly ok: false; readonly reason: "rate-limited"; readonly retryAfterSeconds: number };

export type PasswordResetVerifyResult =
  | { readonly ok: true }
  /** Wrong code, unknown email, or bad new password (see `field`). */
  | {
      readonly ok: false;
      readonly reason: "invalid";
      readonly field: PasswordResetField;
      readonly message: string;
      /** Wrong tries left on this code, when known. */
      readonly attemptsLeft?: number;
    }
  /** The code is older than 15 minutes: ask for a new one. */
  | { readonly ok: false; readonly reason: "expired" }
  /** 5 wrong tries burned the code: ask for a new one. */
  | { readonly ok: false; readonly reason: "too-many-tries" }
  /** Too many attempts overall for this email right now. */
  | { readonly ok: false; readonly reason: "rate-limited"; readonly retryAfterSeconds: number };

// ---------- Registration ----------

/** A team the new employee can join on the "employee ID card" register screen. */
export interface RegistrationTeam {
  readonly id: string;
  readonly name: string;
  /** People already on the team (shown as "12 colleagues"). Optional until the real list adds it. */
  readonly memberCount?: number;
}

// ---------- Gamification ----------

export interface Badge {
  readonly key: string;
  readonly name: string;
  readonly description: string;
  /** Hero 3D object key, e.g. 'medal'. */
  readonly objectKey: string;
  /** ISO timestamp, or null while locked. */
  readonly earnedAt: string | null;
}

/** "habit" quests are behaviour quests such as "Clock in today" (no manual check-in). */
export type QuestType = "scenario" | "habit" | "stars";

export interface Quest {
  readonly id: string;
  readonly type: QuestType;
  readonly label: string;
  readonly target: number;
  readonly progress: number;
  readonly completed: boolean;
  readonly xpReward: number;
}

export interface TodaysChallenge {
  readonly scenario: ScenarioSummary;
  readonly categoryKey: CategoryKey;
  readonly bonusXp: number;
  readonly completedToday: boolean;
}

export interface ContinueTraining {
  readonly categoryKey: CategoryKey;
  readonly categoryName: string;
  readonly node: LevelNode;
}

export interface HomeData {
  readonly user: UserSummary;
  readonly streak: number;
  readonly xpToNext: number;
  /** 0 to 1, for the XP bar. */
  readonly xpProgress: number;
  readonly challenge: TodaysChallenge;
  readonly continueTraining: ContinueTraining | null;
  readonly categories: readonly Category[];
  /** Detected habits for the Home card (replaces the old manual "today's habits"). */
  readonly habits: HomeHabits;
  readonly quests: readonly Quest[];
}

// ---------- Leaderboard ----------

export type LeaderboardScope = "team" | "company";
export type LeaderboardPeriod = "week" | "all";

export interface LeaderboardEntry {
  readonly rank: number;
  readonly user: UserSummary;
  readonly xp: number;
  /** Positive = moved up, negative = moved down, 0 = same. */
  readonly rankChange: number;
  /** True when the user joined the board recently: show a "New" tag instead of a change. */
  readonly isNew?: boolean;
}

export interface Leaderboard {
  readonly scope: LeaderboardScope;
  readonly period: LeaderboardPeriod;
  readonly entries: readonly LeaderboardEntry[];
  readonly me: LeaderboardEntry;
}

// ---------- Celebrations ----------

export type Celebration =
  | { readonly type: "level-up"; readonly level: number }
  | { readonly type: "new-badge"; readonly badge: Badge }
  | { readonly type: "streak"; readonly days: 7 | 30 | 100 }
  | { readonly type: "perfect"; readonly scenarioTitle: string };
