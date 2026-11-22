import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
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
        onCheckIn={vi.fn().mockResolvedValue({ ok: true, xpEarned: 10, streak: 1 })}
      />,
    );

    // Greeting
    const firstName = data.user.name.split(" ")[0];
    expect(
      screen.getByRole("heading", { level: 1, name: new RegExp(`Hi, ${firstName}`, "i") }),
    ).toBeDefined();

    // Quests
    for (const quest of data.quests) {
      expect(screen.getByText(quest.label)).toBeDefined();
    }

    // Habits
    for (const habit of data.todaysHabits) {
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
      todaysHabits: [],
    };

    render(
      <HomeScreen
        data={emptyData}
        myRank={null}
        onCheckIn={vi.fn()}
      />,
    );

    expect(screen.getByText("No quests today")).toBeDefined();
    expect(screen.getByText("No habits yet")).toBeDefined();
    expect(screen.getByRole("link", { name: /view habits/i }).getAttribute("href")).toBe("/habits");
    expect(screen.queryByText(/You are #/i)).toBeNull();
  });

  it("optimistically checks in a not-done habit and calls onCheckIn", async () => {
    const data = await mockHomeRepo.getHome(ME_ID);
    const notDoneHabit = data.todaysHabits.find((h) => !h.doneToday);
    expect(notDoneHabit).toBeDefined();

    const onCheckIn = vi.fn().mockResolvedValue({
      ok: true,
      xpEarned: 10,
      streak: 7,
    });

    render(
      <HomeScreen
        data={data}
        myRank={null}
        onCheckIn={onCheckIn}
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: notDoneHabit!.title,
    }) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);

    expect(checkbox.checked).toBe(true);
    expect(checkbox.disabled).toBe(true);
    expect(onCheckIn).toHaveBeenCalledWith(notDoneHabit!.id);

    await waitFor(() => {
      expect(screen.getByText("+10 XP")).toBeDefined();
    });
  });

  it("rolls back optimistic check-in and displays an alert when onCheckIn fails", async () => {
    const data = await mockHomeRepo.getHome(ME_ID);
    const notDoneHabit = data.todaysHabits.find((h) => !h.doneToday);
    expect(notDoneHabit).toBeDefined();

    const onCheckIn = vi.fn().mockResolvedValue({
      ok: false,
      error: "Failed to connect to server",
    });

    render(
      <HomeScreen
        data={data}
        myRank={null}
        onCheckIn={onCheckIn}
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: notDoneHabit!.title,
    }) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);

    // Optimistically flipped immediately
    expect(checkbox.checked).toBe(true);

    // After failure, alert appears and rolled back
    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert.textContent).toBe("Failed to connect to server");
    });

    expect(checkbox.checked).toBe(false);
    expect(checkbox.disabled).toBe(false);
  });
});
