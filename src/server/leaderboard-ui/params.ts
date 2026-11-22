import type { LeaderboardPeriod, LeaderboardScope } from "@/lib/types";

export interface LeaderboardParamsInput {
  scope?: string | string[];
  period?: string | string[];
  [key: string]: unknown;
}

export interface ParsedLeaderboardParams {
  scope: LeaderboardScope;
  period: LeaderboardPeriod;
}

const DEFAULT_SCOPE: LeaderboardScope = "team";
const DEFAULT_PERIOD: LeaderboardPeriod = "week";

function extractFirst(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" ? first : undefined;
  }
  if (typeof value === "string") {
    return value;
  }
  return undefined;
}

function isValidScope(val: unknown): val is LeaderboardScope {
  return val === "team" || val === "company";
}

function isValidPeriod(val: unknown): val is LeaderboardPeriod {
  return val === "week" || val === "all";
}

export function parseLeaderboardParams(raw?: LeaderboardParamsInput | null): ParsedLeaderboardParams {
  const rawScope = extractFirst(raw?.scope);
  const rawPeriod = extractFirst(raw?.period);

  return {
    scope: isValidScope(rawScope) ? rawScope : DEFAULT_SCOPE,
    period: isValidPeriod(rawPeriod) ? rawPeriod : DEFAULT_PERIOD,
  };
}
