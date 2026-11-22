import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ME_ID } from "@/data/mock";
import { mockTrainingRepo } from "@/data/mock/training";
import type { LevelNode } from "@/lib/types";
import { LevelPath } from "./LevelPath";

beforeAll(() => {
  if (typeof window !== "undefined" && !window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  }
});

describe("LevelPath", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders 5 items with boss item locked (aria-disabled, not a link) when levels 1-4 are not all starred", async () => {
    const categories = await mockTrainingRepo.listCategories(ME_ID);
    const category = categories[0]!;
    const levels = await mockTrainingRepo.getLevelPath(ME_ID, category.key);

    expect(levels).toHaveLength(5);

    render(<LevelPath category={category} levels={levels} />);

    // Renders 5 list items in the level path
    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(5);

    // Boss level item is locked (has aria-disabled="true" on its container, not an <a> tag)
    const lockedBoss = screen.getByLabelText(/boss level:.*locked/i);
    expect(lockedBoss).toBeDefined();
    expect(lockedBoss.getAttribute("aria-disabled")).toBe("true");
    expect(lockedBoss.tagName.toLowerCase()).not.toBe("a");
    expect(lockedBoss.closest("a")).toBeNull();

    // Verify no link points to the boss level route
    expect(screen.queryByRole("link", { name: /boss level/i })).toBeNull();
  });

  it("links unlocked boss to /training/<key>/boss when passed modified nodes", async () => {
    const categories = await mockTrainingRepo.listCategories(ME_ID);
    const category = categories[0]!;
    const levels = await mockTrainingRepo.getLevelPath(ME_ID, category.key);

    // Modify nodes so levels 1-4 all have stars and the boss node is unlocked
    const unlockedLevels: LevelNode[] = levels.map((n) => ({
      ...n,
      locked: false,
      stars: n.kind === "boss" ? 0 : 2,
    }));

    render(<LevelPath category={category} levels={unlockedLevels} />);

    const bossLink = screen.getByRole("link", { name: /boss level/i });
    expect(bossLink).toBeDefined();
    expect(bossLink.getAttribute("href")).toBe(`/training/${category.key}/boss`);
  });

  it("shows empty message when levels array is empty", async () => {
    const categories = await mockTrainingRepo.listCategories(ME_ID);
    const category = categories[0]!;

    render(<LevelPath category={category} levels={[]} />);

    expect(screen.getByText("No levels here yet.")).toBeDefined();
  });
});
