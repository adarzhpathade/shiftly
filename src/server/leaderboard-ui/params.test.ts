import { describe, expect, it } from "vitest";
import { parseLeaderboardParams } from "./params";

describe("parseLeaderboardParams", () => {
  it("defaults to team and week when given empty or missing inputs", () => {
    expect(parseLeaderboardParams()).toEqual({ scope: "team", period: "week" });
    expect(parseLeaderboardParams(null)).toEqual({ scope: "team", period: "week" });
    expect(parseLeaderboardParams({})).toEqual({ scope: "team", period: "week" });
    expect(parseLeaderboardParams({ scope: undefined, period: undefined })).toEqual({
      scope: "team",
      period: "week",
    });
  });

  it("parses valid scope and period values", () => {
    expect(parseLeaderboardParams({ scope: "team", period: "week" })).toEqual({
      scope: "team",
      period: "week",
    });
    expect(parseLeaderboardParams({ scope: "team", period: "all" })).toEqual({
      scope: "team",
      period: "all",
    });
    expect(parseLeaderboardParams({ scope: "company", period: "week" })).toEqual({
      scope: "company",
      period: "week",
    });
    expect(parseLeaderboardParams({ scope: "company", period: "all" })).toEqual({
      scope: "company",
      period: "all",
    });
  });

  it("falls back to defaults on invalid values", () => {
    expect(parseLeaderboardParams({ scope: "global", period: "month" })).toEqual({
      scope: "team",
      period: "week",
    });
    expect(parseLeaderboardParams({ scope: "", period: "" })).toEqual({
      scope: "team",
      period: "week",
    });
    expect(parseLeaderboardParams({ scope: "TEAM", period: "WEEK" })).toEqual({
      scope: "team",
      period: "week",
    });
    expect(parseLeaderboardParams({ scope: "all", period: "team" })).toEqual({
      scope: "team",
      period: "week",
    });
  });

  it("takes the first value when given arrays", () => {
    expect(
      parseLeaderboardParams({
        scope: ["company", "team"],
        period: ["all", "week"],
      }),
    ).toEqual({
      scope: "company",
      period: "all",
    });

    expect(
      parseLeaderboardParams({
        scope: ["team", "company"],
        period: ["week", "all"],
      }),
    ).toEqual({
      scope: "team",
      period: "week",
    });

    expect(
      parseLeaderboardParams({
        scope: ["invalid", "company"],
        period: ["invalid", "all"],
      }),
    ).toEqual({
      scope: "team",
      period: "week",
    });

    expect(
      parseLeaderboardParams({
        scope: [],
        period: [],
      }),
    ).toEqual({
      scope: "team",
      period: "week",
    });
  });
});
