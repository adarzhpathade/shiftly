import type { CoachSummary } from "./summary";

export const EMPTY_WEEK_LINES: readonly [string, string, string] = [
  "Welcome to Shiftly. Your habits show up on their own.",
  "Finish a scenario on 3 different days and your first habit appears.",
  "Short and often beats long and rare. Five minutes counts.",
];

const CATEGORY_NAMES: Record<string, string> = {
  "handling-complaints": "Handling Complaints",
  "customer-queries": "Customer Queries",
  "difficult-customers": "Difficult Customers",
  "problem-solving": "Problem Solving",
};

export function formatCategoryName(key: string): string {
  if (CATEGORY_NAMES[key]) return CATEGORY_NAMES[key];
  return key
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Pure function that generates exactly 3 short, friendly lines (<= 90 characters each)
 * from a CoachSummary fact sheet, matching the mock's warm, supportive tone.
 */
export function generateRulesNote(
  summary: CoachSummary,
): readonly [string, string, string] {
  // If user has zero active days and zero scenarios/boss/quests, return the empty-week set
  if (
    summary.daysActive === 0 &&
    summary.totalScenariosFinished === 0 &&
    summary.bossCallsWon === 0 &&
    summary.bossCallsLost === 0 &&
    summary.questsCompleted === 0
  ) {
    return EMPTY_WEEK_LINES;
  }

  // Line 1: Activity & consistency headline
  let line1: string;
  if (summary.daysActive >= 5) {
    line1 = `Great week: you stayed active on ${summary.daysActive} days across your training.`;
  } else if (summary.daysActive >= 3) {
    line1 = `Solid effort: you completed ${summary.totalScenariosFinished} scenarios over ${summary.daysActive} active days this week.`;
  } else if (summary.daysActive >= 1) {
    const dayWord = summary.daysActive === 1 ? "day" : "days";
    line1 = `Good start: you logged ${summary.daysActive} active ${dayWord} of practice this week.`;
  } else {
    line1 = "Every short practice session builds lasting customer service confidence.";
  }

  // Ensure line 1 is within 90 chars
  if (line1.length > 90) {
    line1 = `Great work staying active on ${summary.daysActive} days of practice this week.`;
  }

  // Line 2: Progress, achievements, or comparison
  let line2: string;
  if (summary.bossCallsWon > 0) {
    const sessionWord = summary.bossCallsWon === 1 ? "session" : "sessions";
    line2 = `You took on challenging boss customers and won ${summary.bossCallsWon} ${sessionWord}.`;
  } else if (summary.perfectScores > 0) {
    const scoreWord = summary.perfectScores === 1 ? "score" : "scores";
    line2 = `You earned ${summary.perfectScores} perfect 3-star ${scoreWord}, demonstrating clear skill.`;
  } else if (summary.averageStars !== null && summary.averageStars >= 2.5) {
    line2 = `Strong quality: you maintained a ${summary.averageStars.toFixed(1)}-star average across scenarios.`;
  } else if (summary.changeVsLastWeek.scenariosFinished > 0) {
    const count = summary.changeVsLastWeek.scenariosFinished;
    const scenarioWord = count === 1 ? "scenario" : "scenarios";
    line2 = `You finished ${count} more ${scenarioWord} than last week, great momentum.`;
  } else if (summary.questsCompleted > 0) {
    const questWord = summary.questsCompleted === 1 ? "quest" : "quests";
    line2 = `You completed ${summary.questsCompleted} daily ${questWord} to keep your skills progressing.`;
  } else {
    line2 = "Short and steady practice beats long, rare sessions every time.";
  }

  if (line2.length > 90) {
    line2 = "Your steady practice is building real confidence in handling customer calls.";
  }

  // Line 3: Forward-looking coaching tip
  let line3: string;
  if (summary.weakestCategory) {
    const catName = formatCategoryName(summary.weakestCategory);
    line3 = `Try ${catName} next: a little practice there lifts your overall score.`;
  } else if (summary.bossCallsLost > 0) {
    line3 = "Give the boss customer another try: patience and empathy will turn it around.";
  } else if (summary.daysActive < 3) {
    line3 = "Aim for three active days next week to kickstart your habit streaks.";
  } else {
    line3 = "Keep this rhythm going next week: five minutes a day makes all the difference.";
  }

  if (line3.length > 90) {
    line3 = "Five minutes of daily practice keeps your skills sharp and habits growing.";
  }

  return [line1, line2, line3] as const;
}
