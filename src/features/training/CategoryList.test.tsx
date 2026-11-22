import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ME_ID } from "@/data/mock";
import { mockTrainingRepo } from "@/data/mock/training";
import { CategoryList } from "./CategoryList";

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

describe("CategoryList", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders 4 category cards with links /training/<key> and Start/Continue labels", async () => {
    const categories = await mockTrainingRepo.listCategories(ME_ID);
    expect(categories).toHaveLength(4);

    render(<CategoryList categories={categories} />);

    for (const category of categories) {
      expect(
        screen.getByRole("heading", { level: 2, name: category.name }),
      ).toBeDefined();

      const link = screen.getByRole("link", { name: new RegExp(category.name, "i") });
      expect(link.getAttribute("href")).toBe(`/training/${category.key}`);

      const expectedLabel = category.progress.completedLevels > 0 ? "Continue" : "Start";
      expect(link.textContent).toContain(expectedLabel);
    }
  });

  it("empty list shows empty message", () => {
    render(<CategoryList categories={[]} />);

    expect(
      screen.getByText("No training categories yet. Check back soon."),
    ).toBeDefined();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
