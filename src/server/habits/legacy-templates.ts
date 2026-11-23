/** LEGACY starter templates for the old manual-habit repository. Do not use in new code. */
import type { HabitTemplate } from "./legacy-types";

const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

export const HABIT_TEMPLATES: readonly HabitTemplate[] = [
  { key: "punctuality", title: "Punctuality", icon: "clock", description: "Start every shift on time.", frequency: "daily", daysOfWeek: ALL_DAYS },
  { key: "communication", title: "Effective Communication", icon: "bubble", description: "Practise one clear, kind message a day.", frequency: "daily", daysOfWeek: ALL_DAYS },
  { key: "task-completion", title: "Task Completion", icon: "check", description: "Finish your top task before the day ends.", frequency: "daily", daysOfWeek: ALL_DAYS },
  { key: "teamwork", title: "Teamwork", icon: "handshake", description: "Help a teammate or share a tip.", frequency: "weekly", daysOfWeek: [2, 4] },
  { key: "follow-up", title: "Customer Follow-up", icon: "phone", description: "Follow up on one open customer case.", frequency: "weekly", daysOfWeek: [1, 3, 5] },
  { key: "daily-learning", title: "Daily Learning", icon: "book", description: "Spend 10 minutes learning something new.", frequency: "daily", daysOfWeek: ALL_DAYS },
];
