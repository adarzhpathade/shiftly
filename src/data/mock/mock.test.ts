import { beforeEach, describe, expect, it } from "vitest";
import { BOSS_DAILY_LIMIT, MAX_REPLY_CHARS } from "@/lib/gamification";
import type { BossSession, BossStreamEvent, CategoryKey } from "@/lib/types";
import {
  ME_ID,
  mockActivityRepo,
  mockBossRepo,
  mockGamificationRepo,
  mockHabitRepo,
  mockHomeRepo,
  mockLeaderboardRepo,
  mockPasswordResetRepo,
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
    expect(home.habits.items.length).toBeGreaterThan(0);
    expect(home.habits.firstHabitsProgress).toBeNull();
    expect(home.habits.slippingCount).toBe(1);
    expect(home.xpProgress).toBeGreaterThanOrEqual(0);
    expect(home.xpProgress).toBeLessThanOrEqual(1);
    expect(home.challenge.scenario.id).toBeTruthy();
    expect(home.continueTraining).not.toBeNull();
  });

  it("returns no habits but a forming progress value for a new user", async () => {
    const home = await mockHomeRepo.getHome("u-brand-new");
    expect(home.habits.items).toEqual([]);
    expect(home.habits.firstHabitsProgress).toBeGreaterThan(0);
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
});

describe("habits (detected automatically)", () => {
  it("returns 3 visible habits in different stages, one slipping, and hides the fading one", async () => {
    const o = await mockHabitRepo.getOverview(ME_ID);
    expect(o.habits).toHaveLength(3);
    expect(new Set(o.habits.map((h) => h.stage))).toEqual(new Set(["forming", "building", "solid"]));
    expect(o.habits.filter((h) => h.status === "slipping")).toHaveLength(1);
    expect(o.habits.some((h) => h.status === "fading")).toBe(false);
    expect(o.fadingCount).toBe(1);
    expect(o.firstHabits).toBeNull();
    for (const h of o.habits) {
      expect(h.heatmap).toHaveLength(84);
      expect(h.consistency).toBeGreaterThanOrEqual(0);
      expect(h.consistency).toBeLessThanOrEqual(1);
      expect(h.usualDays.every((d) => d >= 1 && d <= 7)).toBe(true);
    }
  });

  it("includes insights, one next-habit suggestion and a 3 line coach note", async () => {
    const o = await mockHabitRepo.getOverview(ME_ID);
    expect(o.insights.bestTimeOfDay).not.toBeNull();
    expect(o.insights.skillLink?.liftPercent).toBe(12);
    expect(o.nextHabit?.categoryKey).toBe("difficult-customers");
    expect(o.nextHabit?.progress).toBeCloseTo(1 / 3);
    expect(o.coachNote.lines).toHaveLength(3);
    expect(o.coachNote.isoWeek).toMatch(/^\d{4}-W\d{2}$/);
  });

  it("caches the coach note per user per week", async () => {
    const a = await mockHabitRepo.getCoachNote(ME_ID);
    const b = await mockHabitRepo.getCoachNote(ME_ID);
    expect(b).toBe(a);
    expect((await mockHabitRepo.getOverview(ME_ID)).coachNote).toBe(a);
  });

  it("gives a new user no habits but forming progress and a rules coach note", async () => {
    const o = await mockHabitRepo.getOverview("u-brand-new");
    expect(o.habits).toEqual([]);
    expect(o.firstHabits?.progress).toBeGreaterThan(0);
    expect(o.firstHabits?.progress).toBeLessThanOrEqual(1);
    expect(o.nextHabit).toBeNull();
    expect(o.insights).toEqual({ bestTimeOfDay: null, mostSkippedWeekday: null, skillLink: null, streakAtRisk: null });
    expect(o.coachNote.source).toBe("rules");
  });

  it("returns habit detail, including for a fading habit, and throws for unknown keys", async () => {
    const detail = await mockHabitRepo.getDetail(ME_ID, "clocks-in");
    expect(detail.weeklyCounts.length).toBeGreaterThanOrEqual(12);
    expect(detail.nextStage).toBeNull();
    const slipping = await mockHabitRepo.getDetail(ME_ID, "trains");
    expect(slipping.statusNote).toBeTruthy();
    const fading = await mockHabitRepo.getDetail(ME_ID, "boss-fights");
    expect(fading.status).toBe("fading");
    await expect(mockHabitRepo.getDetail(ME_ID, "nope")).rejects.toThrow("Habit not found");
    await expect(mockHabitRepo.getDetail("u-brand-new", "clocks-in")).rejects.toThrow();
  });
});

describe("activity", () => {
  it("records events, and only the first daily_open per day", async () => {
    const first = await mockActivityRepo.record(ME_ID, { type: "daily_open" });
    expect(first).toEqual({ recorded: true, stageUps: [], xpEarned: 0 });
    const second = await mockActivityRepo.record(ME_ID, { type: "daily_open" });
    expect(second.recorded).toBe(false);
    const training = await mockActivityRepo.record(ME_ID, {
      type: "training_finished",
      categoryKey: "handling-complaints",
      stars: 3,
    });
    expect(training.recorded).toBe(true);
  });

  it("clocking in advances the Clock in today quest", async () => {
    await mockActivityRepo.record(ME_ID, { type: "daily_open" });
    const quests = await mockGamificationRepo.listQuests(ME_ID);
    expect(quests.find((q) => q.type === "habit")?.completed).toBe(true);
  });
});

describe("password reset (mock)", () => {
  it("always answers ok for a valid email, known or not", async () => {
    await expect(mockPasswordResetRepo.requestCode("someone@example.com")).resolves.toEqual({ ok: true });
    await expect(mockPasswordResetRepo.requestCode("nobody-at-all@example.com")).resolves.toEqual({ ok: true });
  });

  it("rejects a malformed email", async () => {
    const r = await mockPasswordResetRepo.requestCode("not-an-email");
    expect(r).toMatchObject({ ok: false, reason: "invalid", field: "email" });
  });

  it("rate limits the 4th request in an hour", async () => {
    for (let i = 0; i < 3; i++) await mockPasswordResetRepo.requestCode("rate@example.com");
    const r = await mockPasswordResetRepo.requestCode("rate@example.com");
    expect(r).toMatchObject({ ok: false, reason: "rate-limited" });
  });

  it("resets with code 123456 and a good password", async () => {
    await expect(mockPasswordResetRepo.verifyAndReset("a@example.com", "123456", "newpassword1")).resolves.toEqual({ ok: true });
  });

  it("rejects a wrong code, a weak password, and burns the code after 5 wrong tries", async () => {
    const weak = await mockPasswordResetRepo.verifyAndReset("b@example.com", "123456", "short");
    expect(weak).toMatchObject({ ok: false, reason: "invalid", field: "newPassword" });
    const wrong = await mockPasswordResetRepo.verifyAndReset("b@example.com", "000000", "newpassword1");
    expect(wrong).toMatchObject({ ok: false, reason: "invalid", field: "code", attemptsLeft: 4 });
    for (let i = 0; i < 3; i++) await mockPasswordResetRepo.verifyAndReset("b@example.com", "000000", "newpassword1");
    const burned = await mockPasswordResetRepo.verifyAndReset("b@example.com", "000000", "newpassword1");
    expect(burned).toEqual({ ok: false, reason: "too-many-tries" });
    // Even the right code no longer works until a new code is requested.
    await expect(mockPasswordResetRepo.verifyAndReset("b@example.com", "123456", "newpassword1")).resolves.toEqual({
      ok: false,
      reason: "too-many-tries",
    });
    await mockPasswordResetRepo.requestCode("b@example.com");
    await expect(mockPasswordResetRepo.verifyAndReset("b@example.com", "123456", "newpassword1")).resolves.toEqual({ ok: true });
  });

  it("reaches the expired, too-many-tries and rate-limited branches with magic emails", async () => {
    await expect(mockPasswordResetRepo.verifyAndReset("expired@example.com", "123456", "newpassword1")).resolves.toEqual({
      ok: false,
      reason: "expired",
    });
    await expect(mockPasswordResetRepo.verifyAndReset("locked@example.com", "123456", "newpassword1")).resolves.toEqual({
      ok: false,
      reason: "too-many-tries",
    });
    await expect(mockPasswordResetRepo.verifyAndReset("limited@example.com", "123456", "newpassword1")).resolves.toMatchObject({
      ok: false,
      reason: "rate-limited",
    });
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

  it("lists the 3 daily quests", async () => {
    const quests = await mockGamificationRepo.listQuests(ME_ID);
    expect(quests).toHaveLength(3);
    expect(quests.find((q) => q.type === "habit")?.label).toBe("Clock in today");
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
    const start = await mockTrainingRepo.startAttempt(ME_ID, "sc-hc-1");
    await mockTrainingRepo.answerStep(ME_ID, start.attemptId, start.firstStepId, "sc-hc-1-s1-c1");
    await mockTrainingRepo.finishAttempt(ME_ID, start.attemptId);
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
