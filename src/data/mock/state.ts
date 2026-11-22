/**
 * Mutable in-memory state shared by all mock repositories (per server process).
 * Check-ins, answers and boss turns change it, so the demo feels alive.
 */
import { addDays, levelForXp, streakAfterCheckIn, toISODate } from "@/lib/gamification";
import type { Stars } from "@/lib/gamification";
import type {
  Badge,
  BossMessage,
  BossStatus,
  BossResult,
  CategoryKey,
  HabitFrequency,
  Quest,
  QuestType,
  ScenarioResult,
  TurnScores,
} from "@/lib/types";
import { BADGE_DEFS, CATEGORY_DEFS, BOSS_PERSONAS, DOUBLE_CHARGE, LATE_DELIVERY, type ScenarioDef } from "./data";

export const ME_ID = "u-me";

export function resolveUser(userId?: string): string {
  void userId;
  return ME_ID;
}


export interface HabitRecord {
  id: string;
  title: string;
  icon: string;
  frequency: HabitFrequency;
  daysOfWeek: readonly number[];
  reminderTime: string | null;
  currentStreak: number;
  bestStreak: number;
  lastCheckIn: string | null;
  /** date -> note ("" when none) */
  logs: Map<string, string>;
}

export interface AttemptRecord {
  id: string;
  userId: string;
  scenarioId: string;
  answers: { stepId: string; choiceId: string; nextStepId: string | null }[];
  result: ScenarioResult | null;
}

export interface BossTurnRecord {
  userText: string;
  scores: TurnScores;
}

export interface BossRecord {
  id: string;
  userId: string;
  personaId: string;
  mood: number;
  turn: number;
  status: BossStatus;
  messages: BossMessage[];
  turns: BossTurnRecord[];
  result: BossResult | null;
}

export interface MockState {
  user: {
    name: string;
    avatarKey: string;
    teamName: string;
    email: string;
    xp: number;
    weeklyXp: number;
    currentStreak: number;
    bestStreak: number;
    lastActiveDate: string | null;
  };
  /** `${categoryKey}:${level}` -> best stars */
  stars: Record<string, Stars>;
  attempts: Map<string, AttemptRecord>;
  bossSessions: Map<string, BossRecord>;
  habits: HabitRecord[];
  badges: Map<string, string>;
  quests: Quest[];
  counters: { scenariosCompleted: number; perfectScores: number; habitCheckIns: number };
  scoreHistory: { date: string; score: number }[];
  challengeDoneOn: string | null;
  /** boss sessions started per date */
  bossStarts: Record<string, number>;
  seq: number;
}

export function today(): string {
  return toISODate(new Date());
}

export function starKey(categoryKey: CategoryKey, level: number): string {
  return `${categoryKey}:${level}`;
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function seedHabit(
  id: string,
  title: string,
  icon: string,
  frequency: HabitFrequency,
  daysOfWeek: readonly number[],
  reminderTime: string | null,
  streak: number,
  streakEndsDaysAgo: number,
  bestStreak: number,
  notes: Record<number, string> = {},
): HabitRecord {
  const now = today();
  const logs = new Map<string, string>();
  const end = addDays(now, -streakEndsDaysAgo);
  // The current streak: consecutive days ending at `end`.
  for (let i = 0; i < streak; i++) logs.set(addDays(end, -i), notes[i] ?? "");
  // Older history with a gap day before the streak, so the heatmap looks natural.
  for (let i = streak + 1; i < 84; i++) {
    const date = addDays(end, -i);
    if (hash(`${id}:${date}`) % 100 < 65) logs.set(date, "");
  }
  return {
    id,
    title,
    icon,
    frequency,
    daysOfWeek,
    reminderTime,
    currentStreak: streak,
    bestStreak,
    lastCheckIn: streak > 0 ? end : null,
    logs,
  };
}

export function createInitialState(): MockState {
  const now = today();
  const stars: Record<string, Stars> = {};
  for (const c of CATEGORY_DEFS) for (let l = 1; l <= 5; l++) stars[starKey(c.key, l)] = 0;
  stars[starKey("handling-complaints", 1)] = 2;
  stars[starKey("handling-complaints", 2)] = 3;
  stars[starKey("customer-queries", 1)] = 1;

  const badges = new Map<string, string>([
    ["first-steps", `${addDays(now, -9)}T09:30:00.000Z`],
    ["team-player", `${addDays(now, -6)}T11:00:00.000Z`],
  ]);

  return {
    user: {
      name: "Aarav Mehta",
      avatarKey: "avatar-3",
      teamName: "Support Team A",
      email: "aarav.mehta@example.com",
      xp: 1240,
      weeklyXp: 230,
      currentStreak: 6,
      bestStreak: 12,
      lastActiveDate: addDays(now, -1),
    },
    stars,
    attempts: new Map(),
    bossSessions: new Map(),
    habits: [
      seedHabit("h-punctuality", "Punctuality", "clock", "daily", [1, 2, 3, 4, 5, 6, 7], "09:00", 6, 1, 9, {
        2: "Reached 10 minutes early and prepped my queue.",
      }),
      seedHabit("h-learning", "Daily Learning", "book", "daily", [1, 2, 3, 4, 5, 6, 7], "18:30", 3, 0, 7, {
        0: "Read about the HEARD apology method.",
      }),
      seedHabit("h-followup", "Customer Follow-up", "phone", "weekly", [1, 3, 5], "16:00", 0, 3, 4),
    ],
    badges,
    quests: [
      { id: "q-scenario", type: "scenario", label: "Finish 1 scenario", target: 1, progress: 0, completed: false, xpReward: 30 },
      { id: "q-habits", type: "habit", label: "Check in 3 habits", target: 3, progress: 1, completed: false, xpReward: 20 },
      { id: "q-stars", type: "stars", label: "Score 2 stars or more", target: 1, progress: 0, completed: false, xpReward: 25 },
    ],
    counters: { scenariosCompleted: 5, perfectScores: 1, habitCheckIns: 41 },
    scoreHistory: [
      { date: addDays(now, -12), score: 55 },
      { date: addDays(now, -10), score: 70 },
      { date: addDays(now, -8), score: 65 },
      { date: addDays(now, -5), score: 85 },
      { date: addDays(now, -3), score: 80 },
      { date: addDays(now, -1), score: 100 },
    ],
    challengeDoneOn: null,
    bossStarts: {},
    seq: 1,
  };
}

export let state: MockState = createInitialState();

/** Reset to the seed data (used by tests). */
export function resetMockState(): void {
  state = createInitialState();
}

export function nextId(prefix: string): string {
  state.seq += 1;
  return `${prefix}-${state.seq}`;
}

// ---------- Registries ----------

function buildScenarios(): Record<string, ScenarioDef> {
  const map: Record<string, ScenarioDef> = {};
  for (const cat of CATEGORY_DEFS) {
    for (let i = 0; i < 4; i++) {
      const level = (i + 1) as 1 | 2 | 3 | 4;
      const title = cat.levelTitles[i] ?? "Scenario";
      const real = [LATE_DELIVERY, DOUBLE_CHARGE].find((s) => s.categoryKey === cat.key && s.level === level);
      if (real) {
        map[real.id] = real;
        continue;
      }
      // Placeholder: reuse a seeded scenario's content under a different id/title,
      // so every node on every level path is playable in development.
      const template = level <= 2 ? LATE_DELIVERY : DOUBLE_CHARGE;
      const id = `${cat.key}-l${level}`;
      map[id] = { ...template, id, title, categoryKey: cat.key, level };
    }
  }
  return map;
}

export const SCENARIOS: Record<string, ScenarioDef> = buildScenarios();

export const CHALLENGE_SCENARIO_ID = DOUBLE_CHARGE.id;
export const CHALLENGE_BONUS_XP = 25;

export function personaFor(categoryKey: CategoryKey) {
  const persona = BOSS_PERSONAS.find((p) => p.categoryKey === categoryKey);
  if (!persona) throw new Error(`No boss persona for ${categoryKey}`);
  return persona;
}

// ---------- Shared mutations ----------

export function userLevel(): number {
  return levelForXp(state.user.xp);
}

/** Adds XP and reports a level-up if one happened. */
export function grantXp(amount: number): { newLevel: number } | undefined {
  if (amount <= 0) return undefined;
  const before = levelForXp(state.user.xp);
  state.user.xp += amount;
  state.user.weeklyXp += amount;
  const after = levelForXp(state.user.xp);
  return after > before ? { newLevel: after } : undefined;
}

/** Marks activity today and updates the daily streak. Returns the new streak. */
export function touchActivity(): number {
  const now = today();
  const update = streakAfterCheckIn(state.user.lastActiveDate, now, state.user.currentStreak);
  state.user.currentStreak = update.streak;
  state.user.bestStreak = Math.max(state.user.bestStreak, update.streak);
  state.user.lastActiveDate = now;
  return update.streak;
}

export function badgeOf(key: string): Badge {
  const def = BADGE_DEFS.find((b) => b.key === key);
  if (!def) throw new Error(`Unknown badge ${key}`);
  return { ...def, earnedAt: state.badges.get(key) ?? null };
}

/** Awards badges not yet earned; returns the newly earned ones. */
export function awardBadges(keys: readonly string[]): Badge[] {
  const fresh: Badge[] = [];
  for (const key of keys) {
    if (state.badges.has(key)) continue;
    state.badges.set(key, new Date().toISOString());
    fresh.push(badgeOf(key));
  }
  return fresh;
}

/** Advances quests of `type`. Quests that complete grant their XP right away; returns them. */
export function bumpQuests(type: QuestType, by = 1): Quest[] {
  const done: Quest[] = [];
  state.quests = state.quests.map((q) => {
    if (q.type !== type || q.completed) return q;
    const progress = Math.min(q.target, q.progress + by);
    const next = { ...q, progress, completed: progress >= q.target };
    if (next.completed) done.push(next);
    return next;
  });
  for (const q of done) grantXp(q.xpReward);
  return done;
}

export function bestStars(categoryKey: CategoryKey, level: number): Stars {
  return state.stars[starKey(categoryKey, level)] ?? 0;
}
