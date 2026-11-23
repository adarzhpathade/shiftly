import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ME_ID, mockHomeRepo, mockLeaderboardRepo } from "@/data/mock";
import { HomeScreen } from "./HomeScreen";

describe("HomeScreen", () => {
  afterEach(() => {
    cleanup();
  });
  it("renders greeting, quests, habits, categories, and leaderboard teaser with real mock data", async () => {
    const data = await mockHomeRepo.getHome(ME_ID);
    const leaderboard = await mockLeaderboardRepo.get(ME_ID, "team", "week");
    const myRank = leaderboard.me;

    render(
      <HomeScreen
        data={data}
        myRank={myRank}
      />,
    );

    // Greeting
    const firstName = data.user.name.split(" ")[0];
    expect(
      screen.getByRole("heading", { level: 1, name: new RegExp(String.raw`Hey,\s*${firstName}\s*\[ready\?\]`, "i") }),
    ).toBeDefined();

    // Quests
    for (const quest of data.quests) {
      expect(screen.getByText(quest.label)).toBeDefined();
    }

    // Habits
    for (const habit of data.habits.items) {
      expect(screen.getByText(habit.title)).toBeDefined();
    }

    // Categories
    for (const category of data.categories) {
      expect(screen.getByRole("heading", { level: 3, name: category.name })).toBeDefined();
    }

    // Leaderboard teaser
    expect(screen.getByText(`You are #${myRank.rank} this week`)).toBeDefined();
  });

  it("renders empty states for quests, habits, and null rank teaser", async () => {
    const data = await mockHomeRepo.getHome(ME_ID);
    const emptyData = {
      ...data,
      quests: [],
      habits: { items: [], firstHabitsProgress: 0.33, slippingCount: 0 },
    };

    render(
      <HomeScreen
        data={emptyData}
        myRank={null}
      />,
    );

    expect(screen.getByText("No quests today")).toBeDefined();
    expect(screen.getByText(/No habits yet/)).toBeDefined();
    expect(screen.getByRole("link", { name: /view habits/i }).getAttribute("href")).toBe("/habits");
    expect(screen.queryByText(/You are #/i)).toBeNull();
  });
});
