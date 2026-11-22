import { describe, expect, it } from "vitest";
import type { LevelNode } from "@/lib/types";
import { deriveLevelStates, isBossUnlocked } from "./levelState";

function makeNodes(
  defs: readonly {
    level: 1 | 2 | 3 | 4 | 5;
    stars: 0 | 1 | 2 | 3;
    locked: boolean;
    kind?: "guided" | "boss";
  }[],
): LevelNode[] {
  return defs.map((d) => ({
    level: d.level,
    kind: d.kind ?? (d.level === 5 ? "boss" : "guided"),
    title: d.level === 5 ? "Boss" : `Level ${d.level}`,
    stars: d.stars,
    locked: d.locked,
    scenarioId: d.level === 5 ? null : `s-${d.level}`,
  }));
}

describe("deriveLevelStates", () => {
  it("derives states for a fresh user (level 1 current, levels 2-5 locked)", () => {
    const nodes = makeNodes([
      { level: 1, stars: 0, locked: false },
      { level: 2, stars: 0, locked: true },
      { level: 3, stars: 0, locked: true },
      { level: 4, stars: 0, locked: true },
      { level: 5, stars: 0, locked: true },
    ]);

    const states = deriveLevelStates(nodes);

    expect(states.map((s) => ({ level: s.node.level, state: s.state }))).toEqual([
      { level: 1, state: "current" },
      { level: 2, state: "locked" },
      { level: 3, state: "locked" },
      { level: 4, state: "locked" },
      { level: 5, state: "locked" },
    ]);
  });

  it("derives states for mid-progress (levels 1-2 done, level 3 current, 4-5 locked)", () => {
    const nodes = makeNodes([
      { level: 1, stars: 3, locked: false },
      { level: 2, stars: 1, locked: false },
      { level: 3, stars: 0, locked: false },
      { level: 4, stars: 0, locked: true },
      { level: 5, stars: 0, locked: true },
    ]);

    const states = deriveLevelStates(nodes);

    expect(states.map((s) => ({ level: s.node.level, state: s.state }))).toEqual([
      { level: 1, state: "done" },
      { level: 2, state: "done" },
      { level: 3, state: "current" },
      { level: 4, state: "locked" },
      { level: 5, state: "locked" },
    ]);
  });

  it("marks lowest level as current and other unlocked 0-star nodes as unlocked", () => {
    const nodes = makeNodes([
      { level: 1, stars: 2, locked: false },
      { level: 2, stars: 0, locked: false },
      { level: 3, stars: 0, locked: false },
      { level: 4, stars: 0, locked: true },
      { level: 5, stars: 0, locked: true },
    ]);

    const states = deriveLevelStates(nodes);

    expect(states.map((s) => ({ level: s.node.level, state: s.state }))).toEqual([
      { level: 1, state: "done" },
      { level: 2, state: "current" },
      { level: 3, state: "unlocked" },
      { level: 4, state: "locked" },
      { level: 5, state: "locked" },
    ]);
  });

  it("derives states when all levels are completed", () => {
    const nodes = makeNodes([
      { level: 1, stars: 3, locked: false },
      { level: 2, stars: 2, locked: false },
      { level: 3, stars: 3, locked: false },
      { level: 4, stars: 1, locked: false },
      { level: 5, stars: 2, locked: false },
    ]);

    const states = deriveLevelStates(nodes);

    expect(states.map((s) => ({ level: s.node.level, state: s.state }))).toEqual([
      { level: 1, state: "done" },
      { level: 2, state: "done" },
      { level: 3, state: "done" },
      { level: 4, state: "done" },
      { level: 5, state: "done" },
    ]);
  });

  it("respects locked flag even if stars exist", () => {
    const nodes = makeNodes([
      { level: 1, stars: 3, locked: true },
    ]);

    const states = deriveLevelStates(nodes);
    expect(states[0]?.state).toBe("locked");
  });

  it("correctly identifies current when nodes are provided in non-ascending order", () => {
    const nodes = makeNodes([
      { level: 3, stars: 0, locked: false },
      { level: 1, stars: 2, locked: false },
      { level: 2, stars: 0, locked: false },
    ]);

    const states = deriveLevelStates(nodes);

    expect(states.find((s) => s.node.level === 2)?.state).toBe("current");
    expect(states.find((s) => s.node.level === 3)?.state).toBe("unlocked");
    expect(states.find((s) => s.node.level === 1)?.state).toBe("done");
  });
});

describe("isBossUnlocked", () => {
  it("returns false for a fresh user where levels 1-4 have 0 stars", () => {
    const nodes = makeNodes([
      { level: 1, stars: 0, locked: false },
      { level: 2, stars: 0, locked: true },
      { level: 3, stars: 0, locked: true },
      { level: 4, stars: 0, locked: true },
      { level: 5, stars: 0, locked: true },
    ]);

    expect(isBossUnlocked(nodes)).toBe(false);
  });

  it("returns false when levels 1-3 have stars but level 4 has 0 stars", () => {
    const nodes = makeNodes([
      { level: 1, stars: 3, locked: false },
      { level: 2, stars: 2, locked: false },
      { level: 3, stars: 1, locked: false },
      { level: 4, stars: 0, locked: false },
      { level: 5, stars: 0, locked: true },
    ]);

    expect(isBossUnlocked(nodes)).toBe(false);
  });

  it("returns true when levels 1-4 all have at least 1 star", () => {
    const nodes = makeNodes([
      { level: 1, stars: 1, locked: false },
      { level: 2, stars: 1, locked: false },
      { level: 3, stars: 1, locked: false },
      { level: 4, stars: 1, locked: false },
      { level: 5, stars: 0, locked: false },
    ]);

    expect(isBossUnlocked(nodes)).toBe(true);
  });

  it("returns true when all levels 1-4 have 3 stars", () => {
    const nodes = makeNodes([
      { level: 1, stars: 3, locked: false },
      { level: 2, stars: 3, locked: false },
      { level: 3, stars: 3, locked: false },
      { level: 4, stars: 3, locked: false },
      { level: 5, stars: 2, locked: false },
    ]);

    expect(isBossUnlocked(nodes)).toBe(true);
  });

  it("returns false when any of levels 1-4 is missing from input", () => {
    const nodes = makeNodes([
      { level: 1, stars: 3, locked: false },
      { level: 2, stars: 3, locked: false },
      { level: 3, stars: 3, locked: false },
    ]);

    expect(isBossUnlocked(nodes)).toBe(false);
  });
});
