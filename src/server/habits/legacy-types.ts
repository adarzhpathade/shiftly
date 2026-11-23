/**
 * The OLD manual-habit types (create, edit, check in). They used to live in
 * src/lib/types.ts. Kept here only so the legacy repository still compiles until it
 * is replaced by the automatic habit detection (docs/contract-auto-habits.md).
 * Do not use these in new code.
 */
import type { Badge, Quest } from "@/lib/types";

export type HabitFrequency = "daily" | "weekly";

export interface Habit {
  readonly id: string;
  readonly title: string;
  readonly icon: string;
  readonly frequency: HabitFrequency;
  readonly daysOfWeek: readonly number[];
  readonly reminderTime: string | null;
  readonly currentStreak: number;
  readonly bestStreak: number;
  readonly doneToday: boolean;
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
  readonly heatmap: readonly { readonly date: string; readonly done: boolean }[];
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
  readonly questsCompleted: readonly Quest[];
}

/** The old repository contract. */
export interface LegacyHabitRepository {
  listToday(userId: string): Promise<readonly Habit[]>;
  listTemplates(): Promise<readonly HabitTemplate[]>;
  create(userId: string, input: HabitInput): Promise<Habit>;
  update(userId: string, habitId: string, patch: Partial<HabitInput>): Promise<Habit>;
  remove(userId: string, habitId: string): Promise<void>;
  checkIn(userId: string, habitId: string, note?: string): Promise<CheckInResult>;
  getDetail(userId: string, habitId: string): Promise<HabitDetail>;
}
