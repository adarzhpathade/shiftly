import type { LevelNode } from "@/lib/types";

export type NodeState = "done" | "current" | "unlocked" | "locked";

export function deriveLevelStates(
  levels: readonly LevelNode[],
): readonly { node: LevelNode; state: NodeState }[] {
  // Find the first non-locked node with stars === 0 (lowest level).
  // If array is not ordered by level, sort to ensure lowest level is picked.
  const sortedUnfinished = [...levels]
    .filter((n) => !n.locked && n.stars === 0)
    .sort((a, b) => a.level - b.level);
  const currentCandidate = sortedUnfinished[0];

  return levels.map((node) => {
    let state: NodeState;
    if (node.locked) {
      state = "locked";
    } else if (node.stars > 0) {
      state = "done";
    } else if (currentCandidate && node.level === currentCandidate.level) {
      state = "current";
    } else {
      state = "unlocked";
    }
    return { node, state };
  });
}

export function isBossUnlocked(levels: readonly LevelNode[]): boolean {
  return [1, 2, 3, 4].every((lvl) => {
    const node = levels.find((n) => n.level === lvl);
    return node !== undefined && node.stars >= 1;
  });
}
