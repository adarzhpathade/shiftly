import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { realLeaderboardRepo } from "./repository";
import {
  assembleLeaderboard,
  buildLeaderboardEntries,
  computeRankChange,
  getStartOfDayIST,
  getStartOfWeekIST,
  isMondayIST,
  rankItems,
  type CandidateItem,
  type RankableUser,
} from "./ranking";

describe("Leaderboard ranking helpers", () => {
  describe("rankItems & ties", () => {
    it("sorts by XP descending and breaks ties alphabetically by name", () => {
      const items: CandidateItem[] = [
        { id: "3", name: "Zara", xp: 100 },
        { id: "1", name: "Aarav", xp: 100 },
        { id: "2", name: "Priya", xp: 200 },
      ];

      const ranked = rankItems(items);
      expect(ranked).toEqual([
        expect.objectContaining({ id: "2", name: "Priya", xp: 200, rank: 1 }),
        expect.objectContaining({ id: "1", name: "Aarav", xp: 100, rank: 2 }),
        expect.objectContaining({ id: "3", name: "Zara", xp: 100, rank: 2 }),
      ]);
    });

    it("assigns the same rank to equal XP (standard competition ranking: 1, 1, 3)", () => {
      const items: CandidateItem[] = [
        { id: "1", name: "Aarav", xp: 500 },
        { id: "2", name: "Bhavin", xp: 500 },
        { id: "3", name: "Chirag", xp: 400 },
        { id: "4", name: "Divya", xp: 400 },
        { id: "5", name: "Esha", xp: 300 },
      ];

      const ranked = rankItems(items);
      expect(ranked.map((r) => ({ name: r.name, rank: r.rank }))).toEqual([
        { name: "Aarav", rank: 1 },
        { name: "Bhavin", rank: 1 },
        { name: "Chirag", rank: 3 },
        { name: "Divya", rank: 3 },
        { name: "Esha", rank: 5 },
      ]);
    });

    it("handles 3-way tie for 1st place (1, 1, 1, 4)", () => {
      const items: CandidateItem[] = [
        { id: "1", name: "Aarav", xp: 300 },
        { id: "2", name: "Bhavin", xp: 300 },
        { id: "3", name: "Chetan", xp: 300 },
        { id: "4", name: "Deepak", xp: 150 },
      ];

      const ranked = rankItems(items);
      expect(ranked.map((r) => ({ name: r.name, rank: r.rank }))).toEqual([
        { name: "Aarav", rank: 1 },
        { name: "Bhavin", rank: 1 },
        { name: "Chetan", rank: 1 },
        { name: "Deepak", rank: 4 },
      ]);
    });

    it("handles single item or empty list", () => {
      expect(rankItems([])).toEqual([]);

      const single: CandidateItem = { id: "1", name: "Solo", xp: 50 };
      expect(rankItems([single])).toEqual([expect.objectContaining({ id: "1", rank: 1 })]);
    });
  });

  describe("Week boundary on Monday morning IST", () => {
    it("returns correct start of week on Sunday 23:59:00 IST (previous Monday 00:00 IST)", () => {
      // 2026-11-22 23:59:00 IST = 2026-11-22 18:29:00 UTC
      const sundayNight = new Date("2026-11-22T18:29:00.000Z");
      const startOfWeek = getStartOfWeekIST(sundayNight);

      // Start of that week was Monday 2026-11-16 00:00:00 IST = 2026-11-15 18:30:00 UTC
      expect(startOfWeek.toISOString()).toBe("2026-11-15T18:30:00.000Z");
      expect(isMondayIST(sundayNight)).toBe(false);
    });

    it("resets start of week at exactly Monday 00:00:00 IST", () => {
      // 2026-11-23 00:00:00 IST = 2026-11-22 18:30:00 UTC
      const mondayMidnight = new Date("2026-11-22T18:30:00.000Z");
      const startOfWeek = getStartOfWeekIST(mondayMidnight);

      // Start of this new week is Monday 2026-11-23 00:00:00 IST = 2026-11-22 18:30:00 UTC
      expect(startOfWeek.toISOString()).toBe("2026-11-22T18:30:00.000Z");
      expect(isMondayIST(mondayMidnight)).toBe(true);
    });

    it("maintains current Monday start of week on Monday morning at 09:30 IST", () => {
      // 2026-11-23 09:30:00 IST = 2026-11-23 04:00:00 UTC
      const mondayMorning = new Date("2026-11-23T04:00:00.000Z");
      const startOfWeek = getStartOfWeekIST(mondayMorning);
      const startOfDay = getStartOfDayIST(mondayMorning);

      expect(startOfWeek.toISOString()).toBe("2026-11-22T18:30:00.000Z");
      expect(startOfDay.toISOString()).toBe("2026-11-22T18:30:00.000Z");
      expect(isMondayIST(mondayMorning)).toBe(true);
      // On Monday, start of day equals start of week
      expect(startOfDay.getTime()).toBe(startOfWeek.getTime());
    });

    it("calculates Wednesday midday correctly", () => {
      // 2026-11-25 12:00:00 IST = 2026-11-25 06:30:00 UTC
      const wednesdayMidday = new Date("2026-11-25T06:30:00.000Z");
      const startOfWeek = getStartOfWeekIST(wednesdayMidday);
      const startOfDay = getStartOfDayIST(wednesdayMidday);

      // Start of week is Monday 2026-11-23 00:00:00 IST
      expect(startOfWeek.toISOString()).toBe("2026-11-22T18:30:00.000Z");
      // Start of today is Wednesday 2026-11-25 00:00:00 IST = 2026-11-24 18:30:00 UTC
      expect(startOfDay.toISOString()).toBe("2026-11-24T18:30:00.000Z");
      expect(isMondayIST(wednesdayMidday)).toBe(false);
    });
  });

  describe("Rank change logic", () => {
    it("reports positive rank change when moving up", () => {
      // Yesterday rank 5, today rank 2 -> moved up 3
      const result = computeRankChange(2, 5, false);
      expect(result.rankChange).toBe(3);
      expect(result.isNew).toBeUndefined();
    });

    it("reports negative rank change when moving down", () => {
      // Yesterday rank 2, today rank 6 -> moved down 4
      const result = computeRankChange(6, 2, false);
      expect(result.rankChange).toBe(-4);
      expect(result.isNew).toBeUndefined();
    });

    it("reports 0 when rank is unchanged", () => {
      const result = computeRankChange(3, 3, false);
      expect(result.rankChange).toBe(0);
      expect(result.isNew).toBeUndefined();
    });

    it("reports rankChange 0 and isNew: true for users created today", () => {
      const result = computeRankChange(1, 4, true);
      expect(result.rankChange).toBe(0);
      expect(result.isNew).toBe(true);
    });

    it("reports rankChange 0 when yesterday rank is not available (e.g. Monday week reset)", () => {
      const result = computeRankChange(2, null, false);
      expect(result.rankChange).toBe(0);
      expect(result.isNew).toBeUndefined();
    });
  });

  describe("assembleLeaderboard & empty team", () => {
    it("returns empty entries and null me for empty team", () => {
      const board = assembleLeaderboard("team", "week", [], "u-no-team");
      expect(board.entries).toEqual([]);
      expect(board.me).toBeNull();
      expect(board.scope).toBe("team");
      expect(board.period).toBe("week");
    });
  });

  describe("Viewer outside top 50", () => {
    it("keeps top 50 in entries while preserving viewer entry in me", () => {
      const now = new Date("2026-11-25T10:00:00.000Z");
      const startOfToday = getStartOfDayIST(now);

      // Create 60 users with descending XP
      const users: RankableUser[] = Array.from({ length: 60 }, (_, i) => ({
        id: `u-${i + 1}`,
        name: `User ${String(i + 1).padStart(2, "0")}`,
        avatarKey: "buddy-1",
        teamName: "Support Team A",
        level: 5,
        xp: (60 - i) * 100,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      }));

      const candidates: CandidateItem[] = users.map((u) => ({
        id: u.id,
        name: u.name,
        xp: u.xp,
        user: u,
      }));

      const ranked = rankItems(candidates);
      expect(ranked).toHaveLength(60);

      const allEntries = buildLeaderboardEntries(ranked, null, startOfToday);
      const board = assembleLeaderboard("company", "all", allEntries, "u-55");

      // Entries capped at top 50
      expect(board.entries).toHaveLength(50);
      expect(board.entries[0]?.user.id).toBe("u-1");
      expect(board.entries[49]?.user.id).toBe("u-50");
      expect(board.entries.some((e) => e.user.id === "u-55")).toBe(false);

      // Viewer is preserved in me even though outside top 50
      expect(board.me).toBeDefined();
      expect(board.me.user.id).toBe("u-55");
      expect(board.me.rank).toBe(55);
    });
  });

  describe("Managers/admins unranked in company scope", () => {
    it("returns me as null when viewer is not in the candidate pool", () => {
      const entries = [
        {
          rank: 1,
          user: { id: "emp-1", name: "Emp One", avatarKey: "buddy-1", teamName: "A", level: 1, xp: 100 },
          xp: 100,
          rankChange: 0,
        },
      ];

      const board = assembleLeaderboard("company", "all", entries, "mgr-1");
      expect(board.entries).toHaveLength(1);
      expect(board.me).toBeNull();
    });
  });

  describe("realLeaderboardRepo with database", () => {
    it("retrieves sensible team/week rankings for a seeded employee", async () => {
      const board = await realLeaderboardRepo.get("user-emp-aarohi", "team", "week");
      expect(board.scope).toBe("team");
      expect(board.period).toBe("week");
      expect(board.entries.length).toBeGreaterThan(0);
      expect(board.me).toBeDefined();
      expect(board.me.user.id).toBe("user-emp-aarohi");
      expect(board.me.user.teamName).toBe("Support Team A");
      expect(board.entries.every((e) => e.user.teamName === "Support Team A")).toBe(true);
    });

    it("retrieves company/all rankings with only employees for a seeded employee", async () => {
      const board = await realLeaderboardRepo.get("user-emp-aarohi", "company", "all");
      expect(board.scope).toBe("company");
      expect(board.period).toBe("all");
      expect(board.entries.length).toBeGreaterThan(0);
      expect(board.me).toBeDefined();
      expect(board.me.user.id).toBe("user-emp-aarohi");
      // All entries are ranked with rank >= 1
      for (const entry of board.entries) {
        expect(entry.rank).toBeGreaterThan(0);
        expect(entry.xp).toBeGreaterThanOrEqual(0);
      }
    });

    it("returns null me for manager in company scope", async () => {
      const board = await realLeaderboardRepo.get("user-mgr-support-a", "company", "all");
      expect(board.me).toBeNull();
    });
  });
});
