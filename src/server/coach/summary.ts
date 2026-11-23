import type { DayPart } from "@/lib/types";
import { dayPartForHour } from "@/lib/habits";
import { APP_TIMEZONE, todayISO } from "@/lib/time";

export interface SummaryActivityEvent {
  type: string;
  categoryId?: string | null;
  categorySlug?: string | null;
  categoryKey?: string | null;
  category?: { slug: string; name?: string } | null;
  stars?: number | null;
  meta?: unknown;
  createdAt: Date | string;
}

export interface CoachSummary {
  daysActive: number;
  scenariosFinishedPerCategory: Record<string, number>;
  totalScenariosFinished: number;
  averageStars: number | null;
  bossCallsWon: number;
  bossCallsLost: number;
  perfectScores: number;
  questsCompleted: number;
  mostActiveDayPart: DayPart | null;
  changeVsLastWeek: {
    daysActive: number;
    scenariosFinished: number;
  };
  weakestCategory: string | null;
}

/** Returns the hour of day (0-23) in Asia/Kolkata for a given date. */
export function getKolkataHour(date: Date): number {
  const hourStr = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    hour: "numeric",
    hourCycle: "h23",
  }).format(date);
  return parseInt(hourStr, 10);
}

/** Difference in calendar days between two "YYYY-MM-DD" strings in the same timezone (to - from). */
function calendarDaysDifference(fromStr: string, toStr: string): number {
  const parts1 = fromStr.split("-").map(Number);
  const parts2 = toStr.split("-").map(Number);
  const y1 = parts1[0] ?? 0;
  const m1 = parts1[1] ?? 1;
  const d1 = parts1[2] ?? 1;
  const y2 = parts2[0] ?? 0;
  const m2 = parts2[1] ?? 1;
  const d2 = parts2[2] ?? 1;
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((utc2 - utc1) / 86_400_000);
}

function resolveCategoryKey(event: SummaryActivityEvent): string | null {
  return (
    event.category?.slug ??
    event.categorySlug ??
    event.categoryKey ??
    event.categoryId ??
    null
  );
}

/**
 * Pure function that turns the user's last 7 days of ActivityEvent rows
 * (plus the previous week, for comparison) into a coach fact sheet.
 */
export function summarizeActivity(
  events: readonly SummaryActivityEvent[],
  now: Date = new Date(),
): CoachSummary {
  const todayStr = todayISO(now);

  const currentWeekDays = new Set<string>();
  const previousWeekDays = new Set<string>();

  const currentScenariosPerCat: Record<string, number> = {};
  const currentCategoryStarsSum: Record<string, number> = {};
  const currentCategoryStarsCount: Record<string, number> = {};

  let currentStarsSum = 0;
  let currentStarsCount = 0;

  let currentBossWon = 0;
  let currentBossLost = 0;
  let currentPerfectScoreEvents = 0;
  let currentTrainingPerfectScores = 0;
  let currentQuests = 0;

  let prevScenariosFinished = 0;
  const prevCategoryStarsSum: Record<string, number> = {};
  const prevCategoryStarsCount: Record<string, number> = {};

  const partCounts: Record<DayPart, number> = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
  };

  for (const event of events) {
    const eventDate =
      typeof event.createdAt === "string"
        ? new Date(event.createdAt)
        : event.createdAt;
    const eventDateStr = todayISO(eventDate);
    const daysAgo = calendarDaysDifference(eventDateStr, todayStr);

    const typeLower = event.type.toLowerCase();
    const cat = resolveCategoryKey(event);

    if (daysAgo >= 0 && daysAgo < 7) {
      // Last 7 days (current week window)
      currentWeekDays.add(eventDateStr);

      const hour = getKolkataHour(eventDate);
      const part = dayPartForHour(hour);
      partCounts[part]++;

      if (typeLower === "training_finished") {
        if (cat) {
          currentScenariosPerCat[cat] = (currentScenariosPerCat[cat] ?? 0) + 1;
        }
        if (typeof event.stars === "number" && event.stars > 0) {
          currentStarsSum += event.stars;
          currentStarsCount++;
          if (cat) {
            currentCategoryStarsSum[cat] =
              (currentCategoryStarsSum[cat] ?? 0) + event.stars;
            currentCategoryStarsCount[cat] =
              (currentCategoryStarsCount[cat] ?? 0) + 1;
          }
          if (event.stars === 3) {
            currentTrainingPerfectScores++;
          }
        }
      } else if (typeLower === "boss_finished") {
        let won = false;
        if (
          event.meta &&
          typeof event.meta === "object" &&
          "won" in event.meta
        ) {
          won = Boolean((event.meta as { won?: boolean }).won);
        } else if (typeof event.stars === "number") {
          won = event.stars >= 2;
        }
        if (won) {
          currentBossWon++;
        } else {
          currentBossLost++;
        }
      } else if (typeLower === "perfect_score") {
        currentPerfectScoreEvents++;
      } else if (typeLower === "quest_completed") {
        currentQuests++;
      }
    } else if (daysAgo >= 7 && daysAgo < 14) {
      // Previous week (7-13 days ago)
      previousWeekDays.add(eventDateStr);

      if (typeLower === "training_finished") {
        prevScenariosFinished++;
        if (cat && typeof event.stars === "number" && event.stars > 0) {
          prevCategoryStarsSum[cat] =
            (prevCategoryStarsSum[cat] ?? 0) + event.stars;
          prevCategoryStarsCount[cat] =
            (prevCategoryStarsCount[cat] ?? 0) + 1;
        }
      }
    }
  }

  const totalScenariosFinished = Object.values(currentScenariosPerCat).reduce(
    (a, b) => a + b,
    0,
  );

  const averageStars =
    currentStarsCount > 0
      ? Math.round((currentStarsSum / currentStarsCount) * 10) / 10
      : null;

  // Use explicit perfect_score count if any logged, otherwise training perfects
  const perfectScores =
    currentPerfectScoreEvents > 0
      ? currentPerfectScoreEvents
      : currentTrainingPerfectScores;

  // Most active day part: highest count in last 7 days, ties order morning > afternoon > evening > night
  const totalPartEvents =
    partCounts.morning +
    partCounts.afternoon +
    partCounts.evening +
    partCounts.night;
  let mostActiveDayPart: DayPart | null = null;
  if (totalPartEvents > 0) {
    const partsOrder: DayPart[] = ["morning", "afternoon", "evening", "night"];
    let maxCount = -1;
    for (const p of partsOrder) {
      const count = partCounts[p] ?? 0;
      if (count > maxCount && count > 0) {
        maxCount = count;
        mostActiveDayPart = p;
      }
    }
  }

  // Weakest category: among categories trained this week (or previous week if none this week)
  // Lowest average stars, ties broken by fewest scenarios finished
  let weakestCategory: string | null = null;
  const currentCategories = Object.keys(currentScenariosPerCat);

  if (currentCategories.length > 0) {
    let lowestScore = Infinity;
    let fewestScenarios = Infinity;
    for (const c of currentCategories) {
      const countStars = currentCategoryStarsCount[c] ?? 0;
      const sumStars = currentCategoryStarsSum[c] ?? 0;
      const avg = countStars > 0 ? sumStars / countStars : 0;
      const count = currentScenariosPerCat[c] ?? 0;
      if (avg < lowestScore || (avg === lowestScore && count < fewestScenarios)) {
        lowestScore = avg;
        fewestScenarios = count;
        weakestCategory = c;
      }
    }
  } else {
    // Check previous week categories
    const prevCategories = Object.keys(prevCategoryStarsCount);
    if (prevCategories.length > 0) {
      let lowestScore = Infinity;
      for (const c of prevCategories) {
        const sum = prevCategoryStarsSum[c] ?? 0;
        const count = prevCategoryStarsCount[c] ?? 1;
        const avg = sum / count;
        if (avg < lowestScore) {
          lowestScore = avg;
          weakestCategory = c;
        }
      }
    }
  }

  const daysActive = currentWeekDays.size;
  const prevDaysActive = previousWeekDays.size;

  return {
    daysActive,
    scenariosFinishedPerCategory: currentScenariosPerCat,
    totalScenariosFinished,
    averageStars,
    bossCallsWon: currentBossWon,
    bossCallsLost: currentBossLost,
    perfectScores,
    questsCompleted: currentQuests,
    mostActiveDayPart,
    changeVsLastWeek: {
      daysActive: daysActive - prevDaysActive,
      scenariosFinished: totalScenariosFinished - prevScenariosFinished,
    },
    weakestCategory,
  };
}
