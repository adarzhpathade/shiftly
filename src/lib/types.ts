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
  readonly habitCheckIns: number;
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

// ---------- Habits ----------

export type HabitFrequency = "daily" | "weekly";

export interface Habit {
  readonly id: string;
  readonly title: string;
  /** Icon key, e.g. 'clock'. */
  readonly icon: string;
  readonly frequency: HabitFrequency;
  /** 1 (Mon) to 7 (Sun). All 7 for daily habits. */
  readonly daysOfWeek: readonly number[];
  /** "HH:mm" or null. */
  readonly reminderTime: string | null;
  readonly currentStreak: number;
  readonly bestStreak: number;
  readonly doneToday: boolean;
  /** Whether today is one of the habit's scheduled days (always true for daily). */
  readonly scheduledToday: boolean;
}

export interface HabitInput {
  readonly title: string;
  readonly icon: string;
  readonly frequency: HabitFrequency;
  readonly daysOfWeek: readonly number[];
  readonly reminderTime: string | null;
}

export interface HabitTemplate {
  readonly key: string;
  readonly title: string;
  readonly icon: string;
  readonly description: string;
  readonly frequency: HabitFrequency;
  readonly daysOfWeek: readonly number[];
}

export interface HabitDetail extends Habit {
  /** About 12 weeks, oldest first. */
  readonly heatmap: readonly { readonly date: string; readonly done: boolean }[];
  /** 0 to 1 over the heatmap window. */
  readonly completionRate: number;
  readonly notes: readonly { readonly date: string; readonly text: string }[];
}

export interface CheckInResult {
  readonly habit: Habit;
  readonly xpEarned: number;
  readonly streak: number;
  readonly milestone?: 7 | 30 | 100;
  readonly leveledUp?: { readonly newLevel: number };
  readonly newBadges: readonly Badge[];
  /** Quests this check-in completed. Their XP is already granted (not in xpEarned). */
  readonly questsCompleted: readonly Quest[];
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
  readonly todaysHabits: readonly Habit[];
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
