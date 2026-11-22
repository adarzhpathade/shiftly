import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { ScenarioResult } from "@/lib/types";
import { ResultScreen } from "./ResultScreen";

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

describe("ResultScreen", () => {
  afterEach(() => {
    cleanup();
  });

  const mockResult: ScenarioResult = {
    attemptId: "a1",
    scenarioId: "s1",
    categoryKey: "handling-complaints",
    bestStars: 3,
    nextScenarioId: null,
    score: 18,
    maxScore: 20,
    stars: 3,
    xpEarned: 40,
    newBadges: [
      {
        key: "perfect-score",
        name: "Perfect Score",
        description: "All best answers.",
        objectKey: "trophy",
        earnedAt: new Date().toISOString(),
      },
    ],
    questsCompleted: [
      {
        id: "q-1",
        type: "scenario",
        label: "Finish 1 scenario",
        target: 1,
        progress: 1,
        completed: true,
        xpReward: 30,
      },
    ],
    perStep: [
      {
        stepId: "s1",
        customerMessage: "Hello",
        choiceText: "Great apology",
        rating: "best",
        points: 10,
        feedback: "Excellent empathy",
      },
    ],
    leveledUp: { newLevel: 2 },
  };

  it("renders scenario complete headline, stars, XP earned, badges, quests, and buttons", () => {
    const onReplay = vi.fn();
    render(
      <ResultScreen
        result={mockResult}
        nextHref="/training/handling-complaints/2"
        backHref="/training/handling-complaints"
        onReplay={onReplay}
      />,
    );

    expect(screen.getByText("Scenario complete")).toBeDefined();
    expect(screen.getByRole("img", { name: "3 of 3 stars" })).toBeDefined();
    expect(screen.getByText("XP earned")).toBeDefined();
    expect(screen.getByText("+40 XP")).toBeDefined();
    expect(screen.getByText(/Level up! You are now level 2/i)).toBeDefined();
    expect(screen.getByText(/New badge: Perfect Score/i)).toBeDefined();
    expect(screen.getByText(/Quest done: Finish 1 scenario/i)).toBeDefined();

    const nextLink = screen.getByRole("link", { name: /next level/i });
    expect(nextLink.getAttribute("href")).toBe("/training/handling-complaints/2");

    const backLink = screen.getByRole("link", { name: /back to path/i });
    expect(backLink.getAttribute("href")).toBe("/training/handling-complaints");

    const replayBtn = screen.getByRole("button", { name: /replay/i });
    fireEvent.click(replayBtn);
    expect(onReplay).toHaveBeenCalledTimes(1);
  });
});
