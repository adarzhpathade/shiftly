/** Static seed content for the mock repositories. */
import type {
  CategoryKey,
  ColorToken,
  HabitTemplate,
} from "@/lib/types";
import {
  BOSS_PERSONAS,
  GUIDED_SCENARIOS,
  type BossPersonaDef,
  type ChoiceDef,
  type ScenarioDef,
  type StepDef,
} from "../../../prisma/seed/scenarios/content";

export type { BossPersonaDef, ChoiceDef, ScenarioDef, StepDef };
export { BOSS_PERSONAS, GUIDED_SCENARIOS };

// ---------- Categories ----------

export interface CategoryDef {
  readonly key: CategoryKey;
  readonly name: string;
  readonly colorToken: ColorToken;
  readonly objectKey: string;
  readonly description: string;
  /** Titles for levels 1 to 4 (guided). Level 5 is the boss. */
  readonly levelTitles: readonly [string, string, string, string];
}

export const CATEGORY_DEFS: readonly CategoryDef[] = [
  {
    key: "handling-complaints",
    name: "Handling Complaints",
    colorToken: "peach",
    objectKey: "megaphone",
    description: "Listen, apologise and own the problem.",
    levelTitles: ["Late delivery", "Wrong order", "Double charge", "Damaged item"],
  },
  {
    key: "customer-queries",
    name: "Customer Queries",
    colorToken: "sky",
    objectKey: "bubble",
    description: "Give clear, accurate, helpful answers.",
    levelTitles: ["Product question", "Order status", "Refund policy", "Warranty cover"],
  },
  {
    key: "difficult-customers",
    name: "Difficult Customers",
    colorToken: "lav",
    objectKey: "cloud",
    description: "Stay calm, de-escalate and set boundaries.",
    levelTitles: ["Raised voice", "Rude remarks", "Long queue anger", "Bad review threat"],
  },
  {
    key: "problem-solving",
    name: "Problem Solving",
    colorToken: "lime",
    objectKey: "puzzle",
    description: "Find the root cause, offer options, follow through.",
    levelTitles: ["Repeated issue", "Outside policy", "Missing information", "System outage"],
  },
];

// ---------- Habit templates ----------

const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

export const HABIT_TEMPLATES: readonly HabitTemplate[] = [
  { key: "punctuality", title: "Punctuality", icon: "clock", description: "Start every shift on time.", frequency: "daily", daysOfWeek: ALL_DAYS },
  { key: "communication", title: "Effective Communication", icon: "bubble", description: "Practise one clear, kind message a day.", frequency: "daily", daysOfWeek: ALL_DAYS },
  { key: "task-completion", title: "Task Completion", icon: "check", description: "Finish your top task before the day ends.", frequency: "daily", daysOfWeek: ALL_DAYS },
  { key: "teamwork", title: "Teamwork", icon: "handshake", description: "Help a teammate or share a tip.", frequency: "weekly", daysOfWeek: [2, 4] },
  { key: "follow-up", title: "Customer Follow-up", icon: "phone", description: "Follow up on one open customer case.", frequency: "weekly", daysOfWeek: [1, 3, 5] },
  { key: "daily-learning", title: "Daily Learning", icon: "book", description: "Spend 10 minutes learning something new.", frequency: "daily", daysOfWeek: ALL_DAYS },
];

// ---------- Badges ----------

export interface BadgeDef {
  readonly key: string;
  readonly name: string;
  readonly description: string;
  readonly objectKey: string;
}

export const BADGE_DEFS: readonly BadgeDef[] = [
  { key: "first-steps", name: "First Steps", description: "Finish your first scenario.", objectKey: "medal" },
  { key: "seven-day-streak", name: "7-Day Streak", description: "Check in on a habit 7 days in a row.", objectKey: "flame" },
  { key: "perfect-score", name: "Perfect Score", description: "Earn 3 stars on a scenario.", objectKey: "trophy" },
  { key: "complaint-crusher", name: "Complaint Crusher", description: "Clear 4 levels of Handling Complaints.", objectKey: "megaphone" },
  { key: "team-player", name: "Team Player", description: "Join a team and climb its leaderboard.", objectKey: "heart" },
  { key: "boss-slayer", name: "Boss Slayer", description: "Win a live call against a boss customer.", objectKey: "crown" },
];

// ---------- Leaderboard people ----------

export interface PersonDef {
  readonly id: string;
  readonly name: string;
  readonly avatarKey: string;
  readonly teamName: string;
  readonly xp: number;
  readonly weeklyXp: number;
  readonly rankChange: number;
  readonly isNew?: boolean;
}

export const ME_TEAM = "Support Team A";

export const PEOPLE: readonly PersonDef[] = [
  { id: "u-priya", name: "Priya Nair", avatarKey: "buddy-1", teamName: ME_TEAM, xp: 2860, weeklyXp: 320, rankChange: 1 },
  { id: "u-rohan", name: "Rohan Gupta", avatarKey: "buddy-2", teamName: ME_TEAM, xp: 1710, weeklyXp: 190, rankChange: -1 },
  { id: "u-ananya", name: "Ananya Iyer", avatarKey: "buddy-4", teamName: ME_TEAM, xp: 1120, weeklyXp: 150, rankChange: 2 },
  { id: "u-vikram", name: "Vikram Singh", avatarKey: "buddy-5", teamName: ME_TEAM, xp: 640, weeklyXp: 60, rankChange: 0 },
  { id: "u-meera", name: "Meera Reddy", avatarKey: "buddy-6", teamName: ME_TEAM, xp: 430, weeklyXp: 95, rankChange: 1 },
  { id: "u-karan", name: "Karan Malhotra", avatarKey: "buddy-2", teamName: "Support Team B", xp: 3320, weeklyXp: 410, rankChange: 0 },
  { id: "u-sneha", name: "Sneha Kulkarni", avatarKey: "buddy-1", teamName: "Support Team B", xp: 2410, weeklyXp: 260, rankChange: 2 },
  { id: "u-arjun", name: "Arjun Patel", avatarKey: "buddy-5", teamName: "Support Team B", xp: 1340, weeklyXp: 120, rankChange: -2 },
  { id: "u-divya", name: "Divya Menon", avatarKey: "buddy-4", teamName: "Escalations", xp: 2980, weeklyXp: 350, rankChange: 1 },
  { id: "u-imran", name: "Imran Sheikh", avatarKey: "buddy-3", teamName: "Escalations", xp: 1980, weeklyXp: 210, rankChange: -1 },
  { id: "u-neha", name: "Neha Joshi", avatarKey: "buddy-6", teamName: "Escalations", xp: 910, weeklyXp: 40, rankChange: -3 },
  { id: "u-siddharth", name: "Siddharth Rao", avatarKey: "buddy-3", teamName: "Onboarding", xp: 1560, weeklyXp: 175, rankChange: 3 },
  { id: "u-pooja", name: "Pooja Bansal", avatarKey: "buddy-1", teamName: "Onboarding", xp: 780, weeklyXp: 85, rankChange: 0 },
  { id: "u-rahul", name: "Rahul Verma", avatarKey: "buddy-2", teamName: "Onboarding", xp: 520, weeklyXp: 30, rankChange: 0, isNew: true },
  { id: "u-kavya", name: "Kavya Pillai", avatarKey: "buddy-6", teamName: "Onboarding", xp: 260, weeklyXp: 70, rankChange: 0, isNew: true },
];
