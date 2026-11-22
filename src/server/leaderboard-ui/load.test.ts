import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

import { leaderboardRepo } from "@/data";
import { loadLeaderboardView } from "./load";

describe("loadLeaderboardView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads team / week leaderboard with non-null resetsInMs", async () => {
    const spy = vi.spyOn(leaderboardRepo, "get");
    const result = await loadLeaderboardView("u-me", { scope: "team", period: "week" });

    expect(spy).toHaveBeenCalledWith("u-me", "team", "week");
    expect(result.scope).toBe("team");
    expect(result.period).toBe("week");
    expect(result.leaderboard).toBeDefined();
    expect(result.leaderboard.scope).toBe("team");
    expect(result.leaderboard.period).toBe("week");
    expect(typeof result.resetsInMs).toBe("number");
    expect(result.resetsInMs).toBeGreaterThan(0);
  });

  it("loads company / all leaderboard with null resetsInMs", async () => {
    const spy = vi.spyOn(leaderboardRepo, "get");
    const result = await loadLeaderboardView("u-me", { scope: "company", period: "all" });

    expect(spy).toHaveBeenCalledWith("u-me", "company", "all");
    expect(result.scope).toBe("company");
    expect(result.period).toBe("all");
    expect(result.leaderboard).toBeDefined();
    expect(result.leaderboard.scope).toBe("company");
    expect(result.leaderboard.period).toBe("all");
    expect(result.resetsInMs).toBeNull();
  });

  it("ensures resetsInMs is null for period 'all' regardless of scope", async () => {
    const teamAll = await loadLeaderboardView("u-me", { scope: "team", period: "all" });
    expect(teamAll.period).toBe("all");
    expect(teamAll.resetsInMs).toBeNull();

    const companyAll = await loadLeaderboardView("u-me", { scope: "company", period: "all" });
    expect(companyAll.period).toBe("all");
    expect(companyAll.resetsInMs).toBeNull();
  });

  it("falls back to default team/week when given invalid params", async () => {
    const spy = vi.spyOn(leaderboardRepo, "get");
    const result = await loadLeaderboardView("u-me", {
      scope: "unsupported-scope",
      period: "monthly",
    });

    expect(spy).toHaveBeenCalledWith("u-me", "team", "week");
    expect(result.scope).toBe("team");
    expect(result.period).toBe("week");
    expect(result.leaderboard.scope).toBe("team");
    expect(result.leaderboard.period).toBe("week");
    expect(typeof result.resetsInMs).toBe("number");
    expect(result.resetsInMs).toBeGreaterThan(0);
  });
});
