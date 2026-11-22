import { beforeEach, describe, expect, it } from "vitest";
import { BOSS_DAILY_LIMIT, MAX_REPLY_CHARS } from "@/lib/gamification";
import type { BossSession, BossStreamEvent, CategoryKey } from "@/lib/types";
import {
  ME_ID,
  mockBossRepo,
  mockGamificationRepo,
  mockHabitRepo,
  mockHomeRepo,
  mockLeaderboardRepo,
  mockTrainingRepo,
  registerMockIdentity,
  resetMockState,
} from "./index";

process.env.MOCK_DELAY_SCALE = "0";

beforeEach(() => resetMockState());

async function start(userId: string, key: CategoryKey): Promise<BossSession> {
  const r = await mockBossRepo.startSession(userId, key);
  if (!r.ok) throw new Error("daily limit");
  return r.session;
}

async function collect(stream: AsyncIterable<BossStreamEvent>): Promise<BossStreamEvent[]> {
  const out: BossStreamEvent[] = [];
  for await (const e of stream) out.push(e);
  return out;
}

describe("home", () => {
  it("returns the home view model", async () => {
    const home = await mockHomeRepo.getHome(ME_ID);
    expect(home.user.name).toBeTruthy();
    expect(home.categories).toHaveLength(4);
    expect(home.quests).toHaveLength(3);
    expect(home.todaysHabits.length).toBeGreaterThan(0);
    expect(home.xpProgress).toBeGreaterThanOrEqual(0);
    expect(home.xpProgress).toBeLessThanOrEqual(1);
    expect(home.challenge.scenario.id).toBeTruthy();
    expect(home.continueTraining).not.toBeNull();
  });

  it("returns empty habits and zero habit quest progress for a new user", async () => {
    const home = await mockHomeRepo.getHome("u-brand-new");
    expect(home.todaysHabits).toEqual([]);
    const habitQuest = home.quests.find((q) => q.type === "habit");
    expect(habitQuest?.progress).toBe(0);
  });
});

describe("training", () => {
  it("lists the 4 categories with progress", async () => {
    const cats = await mockTrainingRepo.listCategories(ME_ID);
    expect(cats.map((c) => c.colorToken)).toEqual(["peach", "sky", "lav", "lime"]);
    expect(cats[0]?.progress.mastery).toBeGreaterThan(0);
  });

  it("builds a 5 node level path with a locked boss", async () => {
    const path = await mockTrainingRepo.getLevelPath(ME_ID, "difficult-customers");
    expect(path).toHaveLength(5);
    expect(path[4]?.kind).toBe("boss");
    expect(path[0]?.locked).toBe(false);
    expect(path[1]?.locked).toBe(true);
    expect(path[4]?.locked).toBe(true);
  });

  it("does not leak ratings or feedback in a guided scenario", async () => {
    const s = await mockTrainingRepo.getGuidedScenario("sc-hc-3");
    expect(s.steps).toHaveLength(2);
    for (const step of s.steps) {
      for (const choice of step.choices) {
        expect(Object.keys(choice).sort()).toEqual(["id", "text"]);
      }
    }
  });

  it("answers a step with feedback and finishes with a result", async () => {
    const start = await mockTrainingRepo.startAttempt(ME_ID, "sc-hc-1");
    const answer = await mockTrainingRepo.answerStep(ME_ID, start.attemptId, start.firstStepId, "sc-hc-1-s1-c1");
    expect(answer.rating).toBe("best");
    expect(answer.feedback.length).toBeGreaterThan(10);
    expect(answer.nextStepId).toBeNull();

    const result = await mockTrainingRepo.finishAttempt(ME_ID, start.attemptId);
    expect(result.score).toBe(10);
    expect(result.maxScore).toBe(10);
    expect(result.stars).toBe(3);
    expect(result.perStep).toHaveLength(1);
    // previous best was 2 stars (30 xp), now 3 (40 xp): only the 10 difference.
    expect(result.xpEarned).toBe(10);
    expect(result.newBadges.map((b) => b.key)).toContain("perfect-score");
  });

  it("follows a two step scenario and rejects out of order answers", async () => {
    const start = await mockTrainingRepo.startAttempt(ME_ID, "sc-hc-3");
    await expect(mockTrainingRepo.answerStep(ME_ID, start.attemptId, "sc-hc-3-s2", "sc-hc-3-s2-c1")).rejects.toThrow();
    await expect(mockTrainingRepo.finishAttempt(ME_ID, start.attemptId)).rejects.toThrow();
    const a1 = await mockTrainingRepo.answerStep(ME_ID, start.attemptId, "sc-hc-3-s1", "sc-hc-3-s1-c2");
    expect(a1.rating).toBe("okay");
    expect(a1.nextStepId).toBe("sc-hc-3-s2");
    const a2 = await mockTrainingRepo.answerStep(ME_ID, start.attemptId, "sc-hc-3-s2", "sc-hc-3-s2-c1");
    expect(a2.nextStepId).toBeNull();
    const result = await mockTrainingRepo.finishAttempt(ME_ID, start.attemptId);
    expect(result.score).toBe(15);
    expect(result.maxScore).toBe(20);
    expect(result.stars).toBe(2);
    expect(result.xpEarned).toBeGreaterThan(0);
  });

  it("unlocks the next level after a first completion", async () => {
    const before = await mockTrainingRepo.getLevelPath(ME_ID, "customer-queries");
    expect(before[1]?.locked).toBe(false); // seeded: level 1 already has a star
    const id = before[0]?.scenarioId;
    expect(id).toBeTruthy();
    const start = await mockTrainingRepo.startAttempt(ME_ID, id!);
    await mockTrainingRepo.answerStep(ME_ID, start.attemptId, start.firstStepId, "sc-cq-1-s1-c1");
    await mockTrainingRepo.finishAttempt(ME_ID, start.attemptId);
    const after = await mockTrainingRepo.getLevelPath(ME_ID, "customer-queries");
    expect(after[0]?.stars).toBe(3);
  });
});

describe("boss", () => {
  it("starts a session with the opening line", async () => {
    const s = await start(ME_ID, "handling-complaints");
    expect(s.persona.name).toBe("Mr. Sharma");
    expect(s.status).toBe("active");
    expect(s.maxTurns).toBe(8);
    expect(s.messages).toHaveLength(1);
    expect(s.messages[0]?.role).toBe("customer");
  });

  it("streams tokens then a turn event", async () => {
    const s = await start(ME_ID, "handling-complaints");
    const events = await collect(
      mockBossRepo.sendMessage(ME_ID, s.id, "I'm so sorry, Mr. Sharma. I will personally raise your refund today."),
    );
    const last = events[events.length - 1];
    expect(events.length).toBeGreaterThan(2);
    expect(events.slice(0, -1).every((e) => e.type === "token")).toBe(true);
    expect(last?.type).toBe("turn");
    if (last?.type === "turn") {
      expect(last.moodAfter).toBeGreaterThan(s.mood);
      expect(last.scores.empathy).toBeGreaterThan(3);
      expect(last.status).toBe("active");
    }
    const after = await mockBossRepo.getSession(ME_ID, s.id);
    expect(after.turn).toBe(1);
    expect(after.messages).toHaveLength(3);
  });

  it("lowers mood for a rude reply", async () => {
    const s = await start(ME_ID, "difficult-customers");
    const events = await collect(mockBossRepo.sendMessage(ME_ID, s.id, "CALM DOWN, that is not my problem!!"));
    const turn = events.find((e) => e.type === "turn");
    expect(turn?.type === "turn" && turn.moodAfter < s.mood).toBe(true);
  });

  it("emits a fallback error for /fail", async () => {
    const s = await start(ME_ID, "problem-solving");
    const events = await collect(mockBossRepo.sendMessage(ME_ID, s.id, "/fail"));
    expect(events).toEqual([expect.objectContaining({ type: "error", fallback: true })]);
  });

  it("can be won and finished with a result", async () => {
    const s = await start(ME_ID, "handling-complaints");
    const good =
      "I'm sorry, Mr. Sharma, I understand how frustrating this is. I will personally raise your refund today and I'll call you back tomorrow with the reference.";
    let status = "active";
    for (let i = 0; i < 8 && status === "active"; i++) {
      const events = await collect(mockBossRepo.sendMessage(ME_ID, s.id, good));
      const turn = events.find((e) => e.type === "turn");
      if (turn?.type === "turn") status = turn.status;
    }
    expect(status).toBe("won");
    const result = await mockBossRepo.finishSession(ME_ID, s.id);
    expect(result.status).toBe("won");
    expect(result.stars).toBeGreaterThanOrEqual(1);
    expect(result.xpEarned).toBeGreaterThan(0);
    expect(result.weakestReply?.betterReply).toBeTruthy();
    expect(result.newBadges.map((b) => b.key)).toContain("boss-slayer");
  });
});

describe("boss limits and fallback", () => {
  it("enforces the daily limit", async () => {
    let last = await mockBossRepo.startSession(ME_ID, "handling-complaints");
    expect(last.ok && last.attemptsLeftToday).toBe(BOSS_DAILY_LIMIT - 1);
    for (let i = 1; i < BOSS_DAILY_LIMIT; i++) last = await mockBossRepo.startSession(ME_ID, "handling-complaints");
    expect(last.ok && last.attemptsLeftToday).toBe(0);
    const blocked = await mockBossRepo.startSession(ME_ID, "handling-complaints");
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.reason).toBe("daily-limit");
      expect(new Date(blocked.resetsAt).getTime()).toBeGreaterThan(Date.now());
    }
  });

  it("rejects over-long replies without ending the call", async () => {
    const s = await start(ME_ID, "handling-complaints");
    const events = await collect(mockBossRepo.sendMessage(ME_ID, s.id, "a ".repeat(MAX_REPLY_CHARS)));
    expect(events).toEqual([expect.objectContaining({ type: "error", fallback: false })]);
    expect((await mockBossRepo.getSession(ME_ID, s.id)).status).toBe("active");
  });

  it("points to a guided scenario once in fallback", async () => {
    const s = await start(ME_ID, "customer-queries");
    expect(s.fallbackScenarioId).toBeNull();
    await collect(mockBossRepo.sendMessage(ME_ID, s.id, "/fail"));
    const after = await mockBossRepo.getSession(ME_ID, s.id);
    expect(after.status).toBe("fallback");
    expect(after.fallbackScenarioId).toBeTruthy();
    await expect(mockTrainingRepo.getGuidedScenario(after.fallbackScenarioId!)).resolves.toBeTruthy();
  });
});

describe("quests grant XP on completion", () => {
  it("finishing a scenario completes the quest and adds its XP", async () => {
    const xp0 = (await mockGamificationRepo.getProfile(ME_ID)).xp;
    const start = await mockTrainingRepo.startAttempt(ME_ID, "sc-hc-1");
    await mockTrainingRepo.answerStep(ME_ID, start.attemptId, start.firstStepId, "sc-hc-1-s1-c1");
    const result = await mockTrainingRepo.finishAttempt(ME_ID, start.attemptId);
    expect(result.questsCompleted.map((q) => q.type).sort()).toEqual(["scenario", "stars"]);
    const bonus = result.questsCompleted.reduce((n, q) => n + q.xpReward, 0);
    const xp1 = (await mockGamificationRepo.getProfile(ME_ID)).xp;
    expect(xp1 - xp0).toBe(result.xpEarned + bonus);
  });

  it("the third habit check-in completes the habit quest", async () => {
    const first = await mockHabitRepo.checkIn(ME_ID, "h-punctuality");
    expect(first.questsCompleted).toEqual([]);
    const second = await mockHabitRepo.checkIn(ME_ID, "h-learning");
    expect(second.questsCompleted).toEqual([]);
    const created = await mockHabitRepo.create(ME_ID, { title: "X", icon: "check", frequency: "daily", daysOfWeek: [1, 2, 3, 4, 5, 6, 7], reminderTime: null });
    const third = await mockHabitRepo.checkIn(ME_ID, created.id);
    expect(third.questsCompleted.map((q) => q.type)).toEqual(["habit"]);
  });
});

describe("habits", () => {
  it("flags whether a habit is scheduled today", async () => {
    const all = [1, 2, 3, 4, 5, 6, 7];
    const never = await mockHabitRepo.create(ME_ID, { title: "N", icon: "x", frequency: "weekly", daysOfWeek: [], reminderTime: null });
    const daily = await mockHabitRepo.create(ME_ID, { title: "D", icon: "x", frequency: "daily", daysOfWeek: all, reminderTime: null });
    expect(never.scheduledToday).toBe(false);
    expect(daily.scheduledToday).toBe(true);
  });

  it("lists habits and templates", async () => {
    const habits = await mockHabitRepo.listToday(ME_ID);
    expect(habits.length).toBeGreaterThanOrEqual(3);
    expect((await mockHabitRepo.listTemplates()).length).toBe(6);
  });

  it("checkIn extends the streak, grants XP and hits the 7 day milestone", async () => {
    const before = (await mockHabitRepo.listToday(ME_ID)).find((h) => h.id === "h-punctuality")!;
    expect(before.doneToday).toBe(false);
    expect(before.currentStreak).toBe(6);
    const result = await mockHabitRepo.checkIn(ME_ID, "h-punctuality", "Early again");
    expect(result.streak).toBe(7);
    expect(result.habit.doneToday).toBe(true);
    expect(result.xpEarned).toBeGreaterThan(0);
    expect(result.milestone).toBe(7);
    expect(result.newBadges.map((b) => b.key)).toContain("seven-day-streak");
    const detail = await mockHabitRepo.getDetail(ME_ID, "h-punctuality");
    expect(detail.currentStreak).toBe(7);
    expect(detail.notes[0]?.text).toBe("Early again");
  });

  it("does not double count a second check-in on the same day", async () => {
    await mockHabitRepo.checkIn(ME_ID, "h-punctuality");
    const again = await mockHabitRepo.checkIn(ME_ID, "h-punctuality");
    expect(again.xpEarned).toBe(0);
    expect(again.streak).toBe(7);
    expect(again.newBadges).toEqual([]);
  });

  it("creates, updates and removes", async () => {
    const created = await mockHabitRepo.create(ME_ID, {
      title: "Greet every customer",
      icon: "smile",
      frequency: "daily",
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      reminderTime: "10:00",
    });
    expect(created.currentStreak).toBe(0);
    const updated = await mockHabitRepo.update(ME_ID, created.id, { title: "Greet warmly" });
    expect(updated.title).toBe("Greet warmly");
    await mockHabitRepo.remove(ME_ID, created.id);
    await expect(mockHabitRepo.getDetail(ME_ID, created.id)).rejects.toThrow();
  });

  it("returns a 12 week heatmap and completion rate", async () => {
    const detail = await mockHabitRepo.getDetail(ME_ID, "h-learning");
    expect(detail.heatmap).toHaveLength(84);
    expect(detail.completionRate).toBeGreaterThan(0);
    expect(detail.completionRate).toBeLessThanOrEqual(1);
  });

  it("new user starts with no habits", async () => {
    const habits = await mockHabitRepo.listToday("u-brand-new");
    expect(habits).toEqual([]);
  });

  it("creating Punctuality twice for a new user yields one habit", async () => {
    const userId = "u-brand-new";
    const h1 = await mockHabitRepo.create(userId, {
      title: "Punctuality",
      icon: "clock",
      frequency: "daily",
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      reminderTime: null,
    });
    const h2 = await mockHabitRepo.create(userId, {
      title: "  punctuality  ",
      icon: "clock",
      frequency: "daily",
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      reminderTime: "09:00",
    });
    expect(h1.id).toBe(h2.id);
    const habits = await mockHabitRepo.listToday(userId);
    expect(habits).toHaveLength(1);
    expect(habits[0]?.title).toBe("Punctuality");
  });

  it("demo user still has the 3 defaults and creating Punctuality for them does not add a 4th", async () => {
    const before = await mockHabitRepo.listToday(ME_ID);
    expect(before).toHaveLength(3);

    const created = await mockHabitRepo.create(ME_ID, {
      title: "  punctuality  ",
      icon: "clock",
      frequency: "daily",
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      reminderTime: null,
    });
    expect(created.id).toBe("h-punctuality");

    const after = await mockHabitRepo.listToday(ME_ID);
    expect(after).toHaveLength(3);
  });
});

describe("gamification and leaderboard", () => {
  it("returns the profile", async () => {
    const p = await mockGamificationRepo.getProfile(ME_ID);
    expect(p.level).toBe(3);
    expect(p.xpToNext).toBe(260);
    expect(p.badges.every((b) => b.earnedAt !== null)).toBe(true);
    expect(p.stats.categoryMastery).toHaveLength(4);
  });

  it("lists all badges, earned and locked", async () => {
    const badges = await mockGamificationRepo.listBadges(ME_ID);
    expect(badges.some((b) => b.earnedAt === null)).toBe(true);
    expect(badges.some((b) => b.earnedAt !== null)).toBe(true);
  });

  it("lists quests and updates progress after a check-in", async () => {
    await mockHabitRepo.checkIn(ME_ID, "h-punctuality");
    const quests = await mockGamificationRepo.listQuests(ME_ID);
    expect(quests.find((q) => q.type === "habit")?.progress).toBe(2);
  });

  it("ranks the company and the team", async () => {
    const company = await mockLeaderboardRepo.get(ME_ID, "company", "all");
    expect(company.entries).toHaveLength(16);
    expect(company.entries.map((e) => e.rank)).toEqual(company.entries.map((_, i) => i + 1));
    expect(company.me.user.id).toBe(ME_ID);
    const team = await mockLeaderboardRepo.get(ME_ID, "team", "week");
    expect(team.entries.every((e) => e.user.teamName === "Support Team A")).toBe(true);
    expect(team.me.rank).toBeGreaterThan(0);
  });

  it("moves up the leaderboard after earning XP", async () => {
    const before = (await mockLeaderboardRepo.get(ME_ID, "team", "all")).me;
    await mockHabitRepo.checkIn(ME_ID, "h-punctuality");
    const after = (await mockLeaderboardRepo.get(ME_ID, "team", "all")).me;
    expect(after.xp).toBeGreaterThan(before.xp);
  });
});

describe("identity, avatars, and leaderboard flags", () => {
  it("resolves registered identity for home, profile, and leaderboard", async () => {
    registerMockIdentity("u-viewer-123", { name: "Tara Sharma", avatarKey: "buddy-5" });

    const home = await mockHomeRepo.getHome("u-viewer-123");
    expect(home.user.id).toBe("u-viewer-123");
    expect(home.user.name).toBe("Tara Sharma");
    expect(home.user.avatarKey).toBe("buddy-5");

    const profile = await mockGamificationRepo.getProfile("u-viewer-123");
    expect(profile.id).toBe("u-viewer-123");
    expect(profile.name).toBe("Tara Sharma");
    expect(profile.avatarKey).toBe("buddy-5");

    const board = await mockLeaderboardRepo.get("u-viewer-123", "company", "all");
    expect(board.me.user.id).toBe("u-viewer-123");
    expect(board.me.user.name).toBe("Tara Sharma");
    expect(board.me.user.avatarKey).toBe("buddy-5");
    const entry = board.entries.find((e) => e.user.id === "u-viewer-123");
    expect(entry).toBeDefined();
    expect(entry?.user.name).toBe("Tara Sharma");
    expect(entry?.user.avatarKey).toBe("buddy-5");
  });

  it("falls back to state.user defaults when identity is unregistered", async () => {
    const home = await mockHomeRepo.getHome("u-unregistered");
    expect(home.user.id).toBe("u-unregistered");
    expect(home.user.name).toBe("Aarav Mehta");
    expect(home.user.avatarKey).toBe("buddy-3");

    const profile = await mockGamificationRepo.getProfile("u-unregistered");
    expect(profile.id).toBe("u-unregistered");
    expect(profile.name).toBe("Aarav Mehta");
    expect(profile.avatarKey).toBe("buddy-3");

    const board = await mockLeaderboardRepo.get("u-unregistered", "company", "all");
    expect(board.me.user.id).toBe("u-unregistered");
    expect(board.me.user.name).toBe("Aarav Mehta");
    expect(board.me.user.avatarKey).toBe("buddy-3");
  });

  it("all leaderboard users have buddy avatar keys", async () => {
    const board = await mockLeaderboardRepo.get(ME_ID, "company", "all");
    expect(board.entries.length).toBeGreaterThan(0);
    for (const entry of board.entries) {
      expect(entry.user.avatarKey).toMatch(/^buddy-[1-6]$/);
    }
  });

  it("passes through isNew flag for newly joined leaderboard members", async () => {
    const board = await mockLeaderboardRepo.get(ME_ID, "company", "all");
    const newEntries = board.entries.filter((e) => e.isNew === true);
    expect(newEntries).toHaveLength(2);
    expect(newEntries.map((e) => e.user.name).sort()).toEqual(["Kavya Pillai", "Rahul Verma"]);
    for (const entry of newEntries) {
      expect(entry.rankChange).toBe(0);
    }
  });
});
