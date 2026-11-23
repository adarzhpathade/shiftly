/**
 * Pure habit analyzer: detects repeating behaviours from ActivityEvent records.
 * Rules, thresholds and stages are defined in docs/contract-auto-habits.md.
 * Pure TypeScript: no React, Next or database imports. All dates in Asia/Kolkata.
 */
import { addDays, daysBetween, isoWeekday } from "@/lib/gamification";
import {
  DAY_PARTS,
  dayPartForHour,
  HABIT_CONSISTENCY_WEEKS,
  HABIT_DETECT_MIN_DAYS,
  HABIT_DETECT_WINDOW_DAYS,
  HABIT_FADING_AFTER_DAYS,
  HABIT_FORGET_AFTER_DAYS,
  HABIT_HEATMAP_DAYS,
  HABIT_SOLID_MIN_CONSISTENCY,
  HABIT_SOLID_WEEKS,
  HABIT_WEEK_ON_TRACK_SHARE,
  habitKeyFor,
} from "@/lib/habits";
import type {
  CategoryKey,
  CoachNote,
  DayPart,
  DetectedHabit,
  FirstHabitsProgress,
  HabitDetail,
  HabitHeatCell,
  HabitInsights,
  HabitKind,
  HabitOccurrence,
  HabitsOverview,
  HabitStage,
  HabitStatus,
  HabitWindow,
  NextHabitSuggestion,
} from "@/lib/types";

export interface RawActivityEvent {
  readonly id?: string;
  readonly type: string;
  readonly categoryKey?: CategoryKey | null;
  readonly stars?: number | null;
  readonly createdAt: Date | string;
  readonly meta?: unknown;
}

export interface CategoryInfo {
  readonly key: CategoryKey;
  readonly name: string;
  readonly mastery?: number;
  readonly stars?: number;
  readonly objectKey?: string;
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30

/** Formats a date or timestamp into YYYY-MM-DD in Asia/Kolkata */
export function toKolkataDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const ist = new Date(d.getTime() + IST_OFFSET_MS);
  return ist.toISOString().slice(0, 10);
}

/** Returns the hour of day (0..23) in Asia/Kolkata */
export function toKolkataHour(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  const ist = new Date(d.getTime() + IST_OFFSET_MS);
  return ist.getUTCHours();
}

/** Monday of the week containing `isoDate` */
export function weekStartOf(isoDate: string): string {
  return addDays(isoDate, -(isoWeekday(isoDate) - 1));
}

const STAGE_ORDER: Record<HabitStage, number> = { solid: 0, building: 1, forming: 2 };

const WEEKDAY_NAMES: readonly string[] = [
  "",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface BehaviourCandidate {
  readonly kind: HabitKind;
  readonly categoryKey: CategoryKey | null;
  readonly key: string;
  readonly defaultIcon: string;
}

/** All candidate behaviours that can become a habit */
function getCandidateBehaviours(categories: readonly CategoryInfo[]): BehaviourCandidate[] {
  const candidates: BehaviourCandidate[] = [
    { kind: "trains", categoryKey: null, key: "trains", defaultIcon: "book" },
    { kind: "clocks-in", categoryKey: null, key: "clocks-in", defaultIcon: "clock" },
    { kind: "boss-fights", categoryKey: null, key: "boss-fights", defaultIcon: "rocket" },
    { kind: "completes-quests", categoryKey: null, key: "completes-quests", defaultIcon: "check" },
    { kind: "perfect-scores", categoryKey: null, key: "perfect-scores", defaultIcon: "target" },
  ];

  for (const cat of categories) {
    candidates.push({
      kind: "plays-category",
      categoryKey: cat.key,
      key: habitKeyFor("plays-category", cat.key),
      defaultIcon: cat.objectKey ?? "megaphone",
    });
  }

  return candidates;
}

/** Determines if an event matches a behaviour */
function eventMatchesCandidate(ev: RawActivityEvent, candidate: BehaviourCandidate): boolean {
  const type = ev.type.toLowerCase();
  switch (candidate.kind) {
    case "trains":
      return type === "training_finished";
    case "plays-category":
      return type === "training_finished" && ev.categoryKey === candidate.categoryKey;
    case "clocks-in":
      return type === "daily_open";
    case "boss-fights":
      return type === "boss_finished";
    case "completes-quests":
      return type === "quest_completed";
    case "perfect-scores":
      return type === "perfect_score";
    default:
      return false;
  }
}

interface ParsedEvent {
  readonly raw: RawActivityEvent;
  readonly date: string; // YYYY-MM-DD in IST
  readonly hour: number; // 0..23 in IST
  readonly timestamp: number;
}

function parseEvents(events: readonly RawActivityEvent[]): ParsedEvent[] {
  return events.map((ev) => {
    const d = typeof ev.createdAt === "string" ? new Date(ev.createdAt) : ev.createdAt;
    return {
      raw: ev,
      date: toKolkataDate(d),
      hour: toKolkataHour(d),
      timestamp: d.getTime(),
    };
  });
}

/**
 * Checks if a behaviour meets the detection / retention threshold:
 * It is known while any rolling 14-day window in the last 56 days had >= 3 distinct days.
 */
function isBehaviourKnown(dates: readonly string[], today: string): boolean {
  // Filter distinct dates within the last 56 days (0 to 55 days ago)
  const recentDistinct = Array.from(new Set(dates))
    .filter((d) => d <= today && daysBetween(d, today) < HABIT_FORGET_AFTER_DAYS)
    .sort();

  if (recentDistinct.length < HABIT_DETECT_MIN_DAYS) {
    return false;
  }

  // Check if any rolling 14-day window in the last 56 days had >= 3 distinct days
  for (let offset = 0; offset < HABIT_FORGET_AFTER_DAYS; offset++) {
    const windowEnd = addDays(today, -offset);
    const windowStart = addDays(windowEnd, -(HABIT_DETECT_WINDOW_DAYS - 1));
    const hitsInWindow = recentDistinct.filter((d) => d >= windowStart && d <= windowEnd).length;
    if (hitsInWindow >= HABIT_DETECT_MIN_DAYS) {
      return true;
    }
  }

  return false;
}

/**
 * Computes usual days of week (1..7, Monday to Sunday) based on the last 28 days.
 * A weekday is usual when hit on >= 50% of its dates in the window and >= 2 times.
 * If none qualify, use the 3 most frequent weekdays.
 */
function computeUsualDays(dates: readonly string[], today: string): readonly number[] {
  // Last 28 days: addDays(today, -27) to today
  const windowStart = addDays(today, -27);
  const distinctIn28Days = new Set(
    dates.filter((d) => d >= windowStart && d <= today),
  );

  // In 28 days, each weekday occurs exactly 4 times
  const weekdayHits = new Map<number, number>();
  for (let w = 1; w <= 7; w++) weekdayHits.set(w, 0);

  for (const d of distinctIn28Days) {
    const w = isoWeekday(d);
    weekdayHits.set(w, (weekdayHits.get(w) ?? 0) + 1);
  }

  const qualifying: number[] = [];
  for (let w = 1; w <= 7; w++) {
    const hits = weekdayHits.get(w) ?? 0;
    // 50% of 4 is 2; and >= 2 times
    if (hits >= 2) {
      qualifying.push(w);
    }
  }

  if (qualifying.length > 0) {
    return qualifying.sort((a, b) => a - b);
  }

  // None qualify: use the 3 most frequent weekdays across distinct dates
  const allWeekdayHits = new Map<number, number>();
  for (let w = 1; w <= 7; w++) allWeekdayHits.set(w, 0);
  for (const d of new Set(dates)) {
    const w = isoWeekday(d);
    allWeekdayHits.set(w, (allWeekdayHits.get(w) ?? 0) + 1);
  }

  const sorted = [1, 2, 3, 4, 5, 6, 7].sort((a, b) => {
    const diff = (allWeekdayHits.get(b) ?? 0) - (allWeekdayHits.get(a) ?? 0);
    return diff !== 0 ? diff : a - b;
  });

  return sorted.slice(0, 3).sort((a, b) => a - b);
}

/**
 * Computes usual time window: the day part holding >= 60% of occurrences, else null.
 */
function computeUsualWindow(hours: readonly number[]): HabitWindow | null {
  if (hours.length === 0) return null;

  const partCounts: Record<DayPart, number> = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
  };

  for (const h of hours) {
    const p = dayPartForHour(h);
    partCounts[p] += 1;
  }

  const total = hours.length;
  for (const part of ["morning", "afternoon", "evening", "night"] as const) {
    if (partCounts[part] / total >= 0.6) {
      const { startHour, endHour } = DAY_PARTS[part];
      return { part, startHour, endHour };
    }
  }

  return null;
}

function buildHeatmap(datesWithCounts: Map<string, number>, today: string): HabitHeatCell[] {
  const cells: HabitHeatCell[] = [];
  for (let i = HABIT_HEATMAP_DAYS - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    const count = datesWithCounts.get(date) ?? 0;
    cells.push({ date, count });
  }
  return cells;
}

/**
 * Stage calculation:
 * - A full week counts when behaviour hit >= 60% of usual days that week (min 1 day).
 * - forming: detected, but not yet building
 * - building: last 2 full ISO weeks both counted
 * - solid: last 4 full ISO weeks all counted AND consistency >= 0.8
 */
function computeStageAndConsistency(
  datesWithCounts: Map<string, number>,
  usualDays: readonly number[],
  today: string,
): { stage: HabitStage; consistency: number } {
  const currentWeekStart = weekStartOf(today);
  const weeksCounted: boolean[] = [];

  let totalUsualDaysIn4Weeks = 0;
  let totalUsualDaysHitIn4Weeks = 0;

  for (let w = 1; w <= HABIT_SOLID_WEEKS; w++) {
    const weekStart = addDays(currentWeekStart, -w * 7);
    let usualDaysInWeek = 0;
    let usualHitsInWeek = 0;

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const dayDate = addDays(weekStart, dayOffset);
      const weekday = isoWeekday(dayDate);
      if (usualDays.includes(weekday)) {
        usualDaysInWeek += 1;
        if ((datesWithCounts.get(dayDate) ?? 0) > 0) {
          usualHitsInWeek += 1;
        }
      }
    }

    const share = usualDaysInWeek > 0 ? usualHitsInWeek / usualDaysInWeek : 0;
    const weekCounts = share >= HABIT_WEEK_ON_TRACK_SHARE && usualHitsInWeek >= 1;
    weeksCounted.push(weekCounts);

    if (w <= HABIT_CONSISTENCY_WEEKS) {
      totalUsualDaysIn4Weeks += usualDaysInWeek;
      totalUsualDaysHitIn4Weeks += usualHitsInWeek;
    }
  }

  const consistency =
    totalUsualDaysIn4Weeks > 0
      ? Math.round((totalUsualDaysHitIn4Weeks / totalUsualDaysIn4Weeks) * 100) / 100
      : 0;

  const last2Counted = weeksCounted[0] && weeksCounted[1];
  const last4Counted = last2Counted && weeksCounted[2] && weeksCounted[3];

  let stage: HabitStage = "forming";
  if (last4Counted && consistency >= HABIT_SOLID_MIN_CONSISTENCY) {
    stage = "solid";
  } else if (last2Counted) {
    stage = "building";
  }

  return { stage, consistency };
}

/** Checks whether a time window has ended today in Asia/Kolkata */
export function hasWindowEnded(window: HabitWindow, currentHour: number): boolean {
  if (window.startHour < window.endHour) {
    // e.g. morning 5..12, afternoon 12..17, evening 17..22
    return currentHour >= window.endHour;
  }
  // Night window wraps: 22..5
  return currentHour >= window.endHour && currentHour < window.startHour;
}

/**
 * Streak calculation:
 * - Consecutive usual days the behaviour was seen, counting back from the most recent usual day.
 * - Non-usual days never break a streak.
 * - Today counts only if it was done; a usual today that is not done yet does not break it until window passes/midnight.
 * - If a past usual day was missed before today, currentStreak is 0 (broken) even if done today.
 */
function computeStreaks(
  datesWithCounts: Map<string, number>,
  usualDays: readonly number[],
  today: string,
  doneToday: boolean,
): { currentStreak: number; bestStreak: number } {
  const isTodayUsual = usualDays.includes(isoWeekday(today));

  // Find most recent usual day before today
  let mostRecentPastUsualDate: string | null = null;
  let d = addDays(today, -1);
  for (let i = 0; i < 365; i++) {
    if (usualDays.includes(isoWeekday(d))) {
      mostRecentPastUsualDate = d;
      break;
    }
    d = addDays(d, -1);
  }

  const pastUsualMissed =
    mostRecentPastUsualDate !== null && (datesWithCounts.get(mostRecentPastUsualDate) ?? 0) === 0;

  let currentStreak = 0;

  if (pastUsualMissed) {
    // If a past usual day was missed before today, current streak is 0 (broken) even if done today
    currentStreak = 0;
  } else {
    let pastStreak = 0;
    if (mostRecentPastUsualDate !== null) {
      let checkDate = mostRecentPastUsualDate;
      for (let i = 0; i < 365; i++) {
        if (usualDays.includes(isoWeekday(checkDate))) {
          const hit = (datesWithCounts.get(checkDate) ?? 0) > 0;
          if (hit) {
            pastStreak += 1;
          } else {
            break;
          }
        }
        checkDate = addDays(checkDate, -1);
      }
    }

    if (isTodayUsual && doneToday) {
      currentStreak = 1 + pastStreak;
    } else {
      currentStreak = pastStreak;
    }
  }

  // Compute bestStreak across all 84 heatmap days
  let bestStreak = 0;
  let runningRun = 0;

  const oldestDate = addDays(today, -(HABIT_HEATMAP_DAYS - 1));
  let forwardDate = oldestDate;
  while (forwardDate <= today) {
    const weekday = isoWeekday(forwardDate);
    if (usualDays.includes(weekday)) {
      // For today, count it only if doneToday
      const hit = forwardDate === today ? doneToday : (datesWithCounts.get(forwardDate) ?? 0) > 0;
      if (hit) {
        runningRun += 1;
        if (runningRun > bestStreak) bestStreak = runningRun;
      } else {
        runningRun = 0;
      }
    }
    forwardDate = addDays(forwardDate, 1);
  }

  bestStreak = Math.max(bestStreak, currentStreak);

  return { currentStreak, bestStreak };
}

/**
 * Status calculation:
 * - fading: not seen for >= 14 days
 * - slipping: most recent usual day before today was missed (streak = 0), OR
 *             today is a usual day, usual window ended and not done today
 * - on_track: otherwise
 */
function computeStatus(
  datesWithCounts: Map<string, number>,
  usualDays: readonly number[],
  usualWindow: HabitWindow | null,
  today: string,
  currentHour: number,
  doneToday: boolean,
  lastSeenDate: string | null,
): HabitStatus {
  if (!lastSeenDate) return "fading";

  const daysSinceSeen = daysBetween(lastSeenDate, today);
  if (daysSinceSeen >= HABIT_FADING_AFTER_DAYS) {
    return "fading";
  }

  // Find most recent usual day before today
  let pastUsualMissed = false;
  let d = addDays(today, -1);
  for (let i = 0; i < 30; i++) {
    if (usualDays.includes(isoWeekday(d))) {
      pastUsualMissed = (datesWithCounts.get(d) ?? 0) === 0;
      break;
    }
    d = addDays(d, -1);
  }

  if (pastUsualMissed) {
    return "slipping";
  }

  const isTodayUsual = usualDays.includes(isoWeekday(today));
  if (isTodayUsual && !doneToday && usualWindow && hasWindowEnded(usualWindow, currentHour)) {
    return "slipping";
  }

  return "on_track";
}

function buildTitle(
  candidate: BehaviourCandidate,
  categoryName: string | null,
  usualDays: readonly number[],
  usualWindow: HabitWindow | null,
): string {
  const windowLabel = usualWindow ? usualWindow.part : null;

  switch (candidate.kind) {
    case "clocks-in":
      if (windowLabel === "morning") return "Clocks in every morning";
      if (windowLabel) return `Clocks in in the ${windowLabel}`;
      return "Clocks in regularly";
    case "trains":
      if (usualDays.length === 5 && usualDays.every((d) => d >= 1 && d <= 5) && windowLabel === "evening") {
        return "Trains on weekday evenings";
      }
      if (windowLabel === "evening") return "Trains on evenings";
      if (windowLabel === "morning") return "Trains in the morning";
      if (windowLabel) return `Trains in the ${windowLabel}`;
      return "Trains regularly";
    case "plays-category": {
      const name = categoryName ?? "Category";
      if (usualDays.length === 3) return `Plays ${name} 3x a week`;
      if (usualDays.length === 2) return `Plays ${name} 2x a week`;
      if (usualDays.length === 5) return `Plays ${name} on weekdays`;
      return `Plays ${name} regularly`;
    }
    case "boss-fights":
      return "Takes on boss customers";
    case "completes-quests":
      return "Finishes daily quests";
    case "perfect-scores":
      return "Aims for 3 stars";
  }
}

function buildDescription(
  candidate: BehaviourCandidate,
  categoryName: string | null,
  recent14DayHits: number,
  status: HabitStatus,
): string {
  if (status === "fading") {
    return "You have not practised this habit recently, but you can bring it back anytime.";
  }

  switch (candidate.kind) {
    case "clocks-in":
      return "You open Shiftly before noon on most weekdays.";
    case "trains":
      return `You finished ${recent14DayHits} scenarios in the last 14 days.`;
    case "plays-category":
      return `You practised ${categoryName ?? "this category"} on ${recent14DayHits} different days in the last 14 days.`;
    case "boss-fights":
      return `You took on boss customers on ${recent14DayHits} different days in the last 14 days.`;
    case "completes-quests":
      return `You completed daily quests on ${recent14DayHits} days in the last 14 days.`;
    case "perfect-scores":
      return `You scored 3 stars on ${recent14DayHits} different days in the last 14 days.`;
  }
}

/**
 * Pure habit detection: discovers repeating behaviours from parsed events.
 */
export function detectHabits(
  rawEvents: readonly RawActivityEvent[],
  categories: readonly CategoryInfo[],
  now: Date = new Date(),
): readonly DetectedHabit[] {
  const events = parseEvents(rawEvents);
  const today = toKolkataDate(now);
  const currentHour = toKolkataHour(now);

  const candidates = getCandidateBehaviours(categories);
  const categoryMap = new Map<CategoryKey, CategoryInfo>(categories.map((c) => [c.key, c]));

  const detected: DetectedHabit[] = [];

  for (const candidate of candidates) {
    const matching = events.filter((ev) => eventMatchesCandidate(ev.raw, candidate));
    const dates = matching.map((ev) => ev.date);

    if (!isBehaviourKnown(dates, today)) {
      continue;
    }

    const hours = matching.map((ev) => ev.hour);
    const datesWithCounts = new Map<string, number>();
    for (const d of dates) {
      datesWithCounts.set(d, (datesWithCounts.get(d) ?? 0) + 1);
    }

    const usualDays = computeUsualDays(dates, today);
    const usualWindow = computeUsualWindow(hours);

    const { stage, consistency } = computeStageAndConsistency(datesWithCounts, usualDays, today);

    const doneToday = (datesWithCounts.get(today) ?? 0) > 0;
    const { currentStreak, bestStreak } = computeStreaks(datesWithCounts, usualDays, today, doneToday);

    const lastEvent = [...matching].sort((a, b) => b.timestamp - a.timestamp)[0];
    const lastSeenDate = lastEvent ? lastEvent.date : null;
    const lastSeenAt = lastEvent
      ? (typeof lastEvent.raw.createdAt === "string" ? lastEvent.raw.createdAt : lastEvent.raw.createdAt.toISOString())
      : now.toISOString();

    const status = computeStatus(
      datesWithCounts,
      usualDays,
      usualWindow,
      today,
      currentHour,
      doneToday,
      lastSeenDate,
    );

    const heatmap = buildHeatmap(datesWithCounts, today);

    // Count distinct days in the last 14 days
    const windowStart14 = addDays(today, -13);
    const recent14DayHits = new Set(dates.filter((d) => d >= windowStart14 && d <= today)).size;

    const categoryName = candidate.categoryKey ? categoryMap.get(candidate.categoryKey)?.name ?? null : null;
    const title = buildTitle(candidate, categoryName, usualDays, usualWindow);
    const description = buildDescription(candidate, categoryName, recent14DayHits, status);

    detected.push({
      key: candidate.key,
      kind: candidate.kind,
      categoryKey: candidate.categoryKey,
      title,
      description,
      icon: candidate.defaultIcon,
      usualDays,
      usualWindow,
      stage,
      status,
      currentStreak,
      bestStreak,
      consistency,
      doneToday,
      heatmap,
      lastSeenAt,
    });
  }

  return detected;
}

/**
 * Computes insights:
 * - bestTimeOfDay: >= 10 training events on >= 5 days
 * - mostSkippedWeekday: >= 3 full weeks of data, weekday with fewest active days if another has >= 2 more
 * - skillLink: >= 4 training days in each group, lift >= 5%
 * - streakAtRisk: visible habit with currentStreak >= 3 not done today
 */
export function computeInsights(
  rawEvents: readonly RawActivityEvent[],
  detectedHabits: readonly DetectedHabit[],
  now: Date = new Date(),
): HabitInsights {
  const events = parseEvents(rawEvents);
  const today = toKolkataDate(now);

  // 1. bestTimeOfDay
  const trainingEvents = events.filter((ev) => ev.raw.type.toLowerCase() === "training_finished");
  const trainingDates = new Set(trainingEvents.map((ev) => ev.date));

  let bestTimeOfDay: HabitInsights["bestTimeOfDay"] = null;
  let bestPart: DayPart | null = null;

  if (trainingEvents.length >= 10 && trainingDates.size >= 5) {
    const partCounts: Record<DayPart, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    for (const ev of trainingEvents) {
      partCounts[dayPartForHour(ev.hour)] += 1;
    }

    const parts: DayPart[] = ["evening", "morning", "afternoon", "night"];
    parts.sort((a, b) => partCounts[b] - partCounts[a]);
    bestPart = parts[0] ?? null;

    const textMap: Record<DayPart, string> = {
      evening: "Most of your training happens in the evening, between 5 and 10 pm.",
      morning: "Most of your training happens in the morning, between 5 am and 12 pm.",
      afternoon: "Most of your training happens in the afternoon, between 12 and 5 pm.",
      night: "Most of your training happens at night, between 10 pm and 5 am.",
    };

    if (bestPart) {
      bestTimeOfDay = { part: bestPart, text: textMap[bestPart] };
    }
  }

  // 2. mostSkippedWeekday
  let mostSkippedWeekday: HabitInsights["mostSkippedWeekday"] = null;
  if (events.length > 0) {
    const allDates = events.map((ev) => ev.date).sort();
    const earliestDate = allDates[0];
    if (earliestDate) {
      const daysOfHistory = daysBetween(earliestDate, today) + 1;

      if (daysOfHistory >= 21) {
        // Evaluate active days by weekday over the last 28 days (or full history up to 84 days)
        const windowStart = addDays(today, -27);
        const activeDatesInWindow = new Set(events.filter((ev) => ev.date >= windowStart && ev.date <= today).map((ev) => ev.date));

        const hitsPerWeekday = new Map<number, number>();
        for (let w = 1; w <= 7; w++) hitsPerWeekday.set(w, 0);

        for (const d of activeDatesInWindow) {
          const w = isoWeekday(d);
          hitsPerWeekday.set(w, (hitsPerWeekday.get(w) ?? 0) + 1);
        }

        let minWeekday = 1;
        let minHits = Infinity;
        let maxHits = -Infinity;

        for (let w = 1; w <= 7; w++) {
          const hits = hitsPerWeekday.get(w) ?? 0;
          if (hits < minHits) {
            minHits = hits;
            minWeekday = w;
          }
          if (hits > maxHits) {
            maxHits = hits;
          }
        }

        if (maxHits - minHits >= 2) {
          const weekdayName = WEEKDAY_NAMES[minWeekday];
          mostSkippedWeekday = {
            isoWeekday: minWeekday,
            text: `${weekdayName} is the day you skip most. Try a quick 5 minute round.`,
          };
        }
      }
    }
  }

  // 3. skillLink
  let skillLink: HabitInsights["skillLink"] = null;
  const targetPart = bestPart ?? "morning";

  // Group training days
  const dayEvents = new Map<string, ParsedEvent[]>();
  for (const ev of trainingEvents) {
    const list = dayEvents.get(ev.date) ?? [];
    list.push(ev);
    dayEvents.set(ev.date, list);
  }

  const groupADays: ParsedEvent[][] = [];
  const groupBDays: ParsedEvent[][] = [];

  for (const [, evs] of dayEvents) {
    const hasBestPart = evs.some((e) => dayPartForHour(e.hour) === targetPart);
    if (hasBestPart) {
      groupADays.push(evs);
    } else {
      groupBDays.push(evs);
    }
  }

  if (groupADays.length >= 4 && groupBDays.length >= 4) {
    const avgScore = (days: ParsedEvent[][]): number => {
      let totalStars = 0;
      let count = 0;
      for (const day of days) {
        for (const ev of day) {
          if (ev.raw.stars !== undefined && ev.raw.stars !== null) {
            totalStars += ev.raw.stars;
            count += 1;
          }
        }
      }
      return count > 0 ? totalStars / count : 0;
    };

    const avgA = avgScore(groupADays);
    const avgB = avgScore(groupBDays);

    if (avgB > 0) {
      const liftPercent = Math.round(((avgA - avgB) / avgB) * 100);
      if (liftPercent >= 5) {
        skillLink = {
          liftPercent,
          text: `On days you train in the ${targetPart} your scores are ${liftPercent}% higher.`,
        };
      }
    }
  }

  // 4. streakAtRisk
  let streakAtRisk: HabitInsights["streakAtRisk"] = null;
  const eligibleHabits = detectedHabits
    .filter((h) => h.status !== "fading" && h.currentStreak >= 3 && !h.doneToday)
    .sort((a, b) => b.currentStreak - a.currentStreak);

  if (eligibleHabits.length > 0 && eligibleHabits[0]) {
    const h = eligibleHabits[0];
    let nudgeText: string;
    if (h.kind === "clocks-in") {
      nudgeText = `Clock in tomorrow morning to keep your ${h.currentStreak} day streak alive.`;
    } else if (h.usualWindow) {
      nudgeText = `${h.title}: practise in the ${h.usualWindow.part} to keep your ${h.currentStreak} day streak alive.`;
    } else {
      nudgeText = `${h.title}: do it today to keep your ${h.currentStreak} day streak alive.`;
    }

    streakAtRisk = {
      habitKey: h.key,
      text: nudgeText,
    };
  }

  return {
    bestTimeOfDay,
    mostSkippedWeekday,
    skillLink,
    streakAtRisk,
  };
}

/**
 * Computes next habit to form: weakest category not already detected as plays-category.
 * Returns null if no training data yet or all categories already detected.
 */
export function computeNextHabit(
  rawEvents: readonly RawActivityEvent[],
  detectedHabits: readonly DetectedHabit[],
  categories: readonly CategoryInfo[],
  now: Date = new Date(),
): NextHabitSuggestion | null {
  const events = parseEvents(rawEvents);
  const trainingEvents = events.filter((ev) => ev.raw.type.toLowerCase() === "training_finished");

  if (trainingEvents.length === 0 || categories.length === 0) {
    return null;
  }

  const detectedCategoryKeys = new Set(
    detectedHabits
      .filter((h) => h.kind === "plays-category" && h.categoryKey)
      .map((h) => h.categoryKey as CategoryKey),
  );

  const candidates = categories.filter((c) => !detectedCategoryKeys.has(c.key));
  if (candidates.length === 0) {
    return null;
  }

  // Weakest category: lowest mastery, ties by fewer stars
  const sorted = [...candidates].sort((a, b) => {
    const mDiff = (a.mastery ?? 0) - (b.mastery ?? 0);
    if (mDiff !== 0) return mDiff;
    const sDiff = (a.stars ?? 0) - (b.stars ?? 0);
    if (sDiff !== 0) return sDiff;
    return a.name.localeCompare(b.name);
  });

  const weakest = sorted[0];
  if (!weakest) {
    return null;
  }

  // Distinct days with this category in the last 14 days
  const today = toKolkataDate(now);
  const windowStart14 = addDays(today, -13);
  const occurrences = new Set(
    trainingEvents
      .filter((ev) => ev.raw.categoryKey === weakest.key && ev.date >= windowStart14 && ev.date <= today)
      .map((ev) => ev.date),
  ).size;

  const needed = HABIT_DETECT_MIN_DAYS;
  const progress = Math.min(1, occurrences / needed);

  return {
    kind: "plays-category",
    categoryKey: weakest.key,
    title: `Play ${weakest.name} Mon/Wed/Fri`,
    reason: `${weakest.name} is your weakest category. A little practice there lifts your overall score.`,
    icon: "target",
    suggestedDays: [1, 3, 5],
    occurrences,
    needed,
    progress,
  };
}

/**
 * Computes first habits forming progress for users with no habits yet.
 */
export function computeFirstHabits(
  rawEvents: readonly RawActivityEvent[],
  detectedHabits: readonly DetectedHabit[],
  now: Date = new Date(),
): FirstHabitsProgress | null {
  const activeHabits = detectedHabits.filter((h) => h.status !== "fading");
  if (activeHabits.length > 0) {
    return null;
  }

  const events = parseEvents(rawEvents);
  const today = toKolkataDate(now);
  const windowStart14 = addDays(today, -13);

  const recentEvents = events.filter((ev) => ev.date >= windowStart14 && ev.date <= today);

  // Group by candidate behaviour and find best occurrences count
  const distinctDaysPerBehaviour = new Map<string, Set<string>>();
  for (const ev of recentEvents) {
    let key: string | null = null;
    const type = ev.raw.type.toLowerCase();
    if (type === "training_finished") {
      key = "trains";
    } else if (type === "daily_open") {
      key = "clocks-in";
    } else if (type === "boss_finished") {
      key = "boss-fights";
    } else if (type === "quest_completed") {
      key = "completes-quests";
    } else if (type === "perfect_score") {
      key = "perfect-scores";
    }

    if (key) {
      const set = distinctDaysPerBehaviour.get(key) ?? new Set();
      set.add(ev.date);
      distinctDaysPerBehaviour.set(key, set);
    }
  }

  let maxOccurrences = 0;
  for (const set of distinctDaysPerBehaviour.values()) {
    if (set.size > maxOccurrences) {
      maxOccurrences = set.size;
    }
  }

  const needed = HABIT_DETECT_MIN_DAYS;
  const occurrences = Math.min(maxOccurrences, needed);
  const progress = Math.min(1, occurrences / needed);

  const remaining = needed - occurrences;
  let hint = "Finish a scenario on 3 different days and your first habit appears.";
  if (remaining === 2) {
    hint = "Finish 2 more scenarios on different days and your first habit appears.";
  } else if (remaining === 1) {
    hint = "Finish 1 more scenario on a different day and your first habit appears.";
  } else if (remaining <= 0) {
    hint = "Your habit is ready to appear.";
  }

  return {
    progress,
    occurrences,
    needed,
    hint,
  };
}

function occurrenceLabel(habit: DetectedHabit): string {
  switch (habit.kind) {
    case "clocks-in":
      return "Clocked in";
    case "boss-fights":
      return "Finished a boss level";
    case "completes-quests":
      return "Completed a daily quest";
    case "perfect-scores":
      return "Scored 3 stars";
    case "plays-category":
      return "Finished a scenario in this category";
    default:
      return "Finished a training scenario";
  }
}

/**
 * Builds HabitDetail from a DetectedHabit and its events.
 */
export function buildHabitDetail(
  habit: DetectedHabit,
  rawEvents: readonly RawActivityEvent[],
): HabitDetail {
  const byWeek = new Map<string, number>();
  for (const cell of habit.heatmap) {
    const week = weekStartOf(cell.date);
    byWeek.set(week, (byWeek.get(week) ?? 0) + cell.count);
  }

  const weeklyCounts = [...byWeek.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([weekStart, count]) => ({ weekStart, count }));

  const candidate: BehaviourCandidate = {
    kind: habit.kind,
    categoryKey: habit.categoryKey,
    key: habit.key,
    defaultIcon: habit.icon,
  };

  const matchingEvents = parseEvents(rawEvents)
    .filter((ev) => eventMatchesCandidate(ev.raw, candidate))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  const label = occurrenceLabel(habit);
  const recent: HabitOccurrence[] = matchingEvents.map((ev) => ({
    at: typeof ev.raw.createdAt === "string" ? ev.raw.createdAt : ev.raw.createdAt.toISOString(),
    label,
  }));

  const statusNote =
    habit.status === "slipping"
      ? "A usual day went by without it. Do it once and you are back on track."
      : habit.status === "fading"
        ? "Not seen for over 2 weeks, so it is hidden from your list. Do it 3 times in 14 days to bring it back."
        : null;

  let nextStage: HabitDetail["nextStage"] = null;
  if (habit.stage === "forming") {
    nextStage = {
      stage: "building",
      progress: Math.min(1, habit.currentStreak / 6),
      hint: "Stay on track for 2 weeks in a row.",
    };
  } else if (habit.stage === "building") {
    nextStage = {
      stage: "solid",
      progress: Math.min(1, (habit.consistency / HABIT_SOLID_MIN_CONSISTENCY) * 0.8),
      hint: "Stay on track for 2 more weeks with 80% consistency.",
    };
  }

  return {
    ...habit,
    weeklyCounts,
    recent,
    statusNote,
    nextStage,
  };
}

/**
 * Analyzes all habits and compiles the complete HabitsOverview.
 */
export function analyzeHabits(
  rawEvents: readonly RawActivityEvent[],
  categories: readonly CategoryInfo[],
  now: Date = new Date(),
  coachNote: CoachNote,
): HabitsOverview {
  const allHabits = detectHabits(rawEvents, categories, now);

  const visibleHabits = allHabits
    .filter((h) => h.status !== "fading")
    .sort((a, b) => {
      const sDiff = STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage];
      if (sDiff !== 0) return sDiff;
      return a.title.localeCompare(b.title);
    });

  const fadingCount = allHabits.length - visibleHabits.length;
  const insights = computeInsights(rawEvents, allHabits, now);
  const nextHabit = computeNextHabit(rawEvents, allHabits, categories, now);
  const firstHabits = computeFirstHabits(rawEvents, allHabits, now);

  return {
    habits: visibleHabits,
    fadingCount,
    nextHabit,
    insights,
    coachNote,
    firstHabits,
  };
}
