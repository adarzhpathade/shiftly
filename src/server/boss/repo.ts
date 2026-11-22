import type { BossResult, BossSession, BossStartResult, BossStreamEvent, CategoryKey } from "@/lib/types";
import type { BossRepository } from "@/data/repositories";
import { db } from "@/server/db";
import { BOSS_DAILY_LIMIT, MAX_BOSS_TURNS, MAX_REPLY_CHARS, replayXp } from "@/lib/gamification";
import type { Stars } from "@/lib/gamification";
import { todayISO, APP_TIMEZONE } from "@/lib/time";
import { addDays } from "@/lib/gamification";
import { BOSS_PERSONAS } from "@/data/mock/data";
import { judgeReply } from "@/data/mock/boss";
import { getAiMode } from "./mode";
import { runTurn } from "./engine";
import { RoleplayStatus, XpSource } from "@/generated/prisma/client";

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function average(s: { empathy: number; ownership: number; clarity: number; solution: number; tone: number }): number {
  return (s.empathy + s.ownership + s.clarity + s.solution + s.tone) / 5;
}

/** Parse the OPENING line from systemPrompt, or fall back to problem. */
function parseOpening(systemPrompt: string, problem: string): string {
  const lines = systemPrompt.split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]?.trim() ?? "";
    if (line.startsWith("OPENING:")) {
      return line.slice("OPENING:".length).trim();
    }
  }
  return problem;
}

/** Look up mock data for a persona by categoryKey (for avatarKey, quickReplies). */
function getMockPersonaData(categoryKey: string) {
  return BOSS_PERSONAS.find((p) => p.categoryKey === categoryKey);
}

export const realBossRepo: BossRepository = {
  async startSession(userId: string, categoryKey: CategoryKey): Promise<BossStartResult> {
    // Load category by slug + its BossPersona
    const category = await db.category.findUnique({
      where: { slug: categoryKey },
      include: { bossPersona: true, scenarios: { where: { level: 1 }, take: 1 } },
    });

    if (!category) throw new Error(`Category not found: ${categoryKey}`);
    if (!category.bossPersona) throw new Error(`No BossPersona configured for category: ${categoryKey}`);

    const persona = category.bossPersona;

    // Per-user daily limit: count sessions started today (Asia/Kolkata)
    const todayStr = todayISO();
    // Start of today in Asia/Kolkata as UTC Date
    const todayStart = new Date(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: APP_TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
        .format(new Date())
        .replace(/(\d{4})-(\d{2})-(\d{2})/, "$1-$2-$3") + "T00:00:00+05:30",
    );

    const sessionCount = await db.roleplaySession.count({
      where: {
        userId,
        startedAt: { gte: todayStart },
      },
    });

    if (sessionCount >= BOSS_DAILY_LIMIT) {
      const [y, m, d] = addDays(todayStr, 1).split("-").map(Number);
      const resetsAt = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).toISOString();
      return { ok: false, reason: "daily-limit", resetsAt };
    }

    // Create session
    const session = await db.roleplaySession.create({
      data: {
        userId,
        personaId: persona.id,
        status: RoleplayStatus.ACTIVE,
        mood: persona.startMood,
      },
    });

    const mockData = getMockPersonaData(categoryKey);
    const opening = parseOpening(persona.systemPrompt, mockData?.opening ?? persona.problem);

    const bossSession: BossSession = {
      id: session.id,
      persona: {
        id: persona.id,
        categoryKey,
        name: persona.name,
        problem: persona.problem,
        avatarKey: mockData?.avatarKey ?? "customer-default",
        startMood: persona.startMood,
      },
      mood: persona.startMood,
      turn: 0,
      maxTurns: 8,
      status: "active",
      messages: [{ role: "customer", text: opening }],
      quickReplies: mockData?.quickReplies ?? [],
      fallbackScenarioId: null,
    };

    return {
      ok: true,
      session: bossSession,
      attemptsLeftToday: BOSS_DAILY_LIMIT - sessionCount - 1,
    };
  },

  async getSession(userId: string, sessionId: string): Promise<BossSession> {
    const session = await db.roleplaySession.findUnique({
      where: { id: sessionId },
      include: {
        turns: { orderBy: { order: "asc" } },
        persona: { include: { category: true } },
      },
    });

    if (!session || session.userId !== userId) throw new Error("Boss session not found");

    const categoryKey = session.persona.category.slug as CategoryKey;
    const mockData = getMockPersonaData(categoryKey);
    const opening = parseOpening(session.persona.systemPrompt, getMockPersonaData(session.persona.category?.slug ?? "")?.opening ?? session.persona.problem);

    // Rebuild messages from turns
    const messages: Array<{ role: "customer" | "user"; text: string }> = [
      { role: "customer", text: opening },
    ];

    for (const turn of session.turns) {
      messages.push({ role: "user", text: turn.userMessage });
      messages.push({ role: "customer", text: turn.customerReply });
    }

    const status = session.status.toLowerCase() as "active" | "won" | "lost" | "fallback";
    const fallbackScenarioId =
      status === "fallback"
        ? await db.scenario
            .findFirst({ where: { categoryId: session.persona.categoryId, level: 1 } })
            .then((s) => s?.id ?? null)
        : null;

    return {
      id: session.id,
      persona: {
        id: session.persona.id,
        categoryKey,
        name: session.persona.name,
        problem: session.persona.problem,
        avatarKey: mockData?.avatarKey ?? "customer-default",
        startMood: session.persona.startMood,
      },
      mood: session.mood,
      turn: session.turns.length,
      maxTurns: 8,
      status,
      messages,
      quickReplies: mockData?.quickReplies ?? [],
      fallbackScenarioId,
    };
  },

  async *sendMessage(
    userId: string,
    sessionId: string,
    text: string,
  ): AsyncIterable<BossStreamEvent> {
    // Load session
    const session = await db.roleplaySession.findUnique({
      where: { id: sessionId },
      include: {
        turns: { orderBy: { order: "asc" } },
        persona: { include: { category: true } },
      },
    });

    if (!session || session.userId !== userId) {
      yield { type: "error", message: "Boss session not found", fallback: false };
      return;
    }

    if (session.status !== RoleplayStatus.ACTIVE) {
      yield { type: "error", message: "This call has already ended.", fallback: false };
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) {
      yield { type: "error", message: "Say something to the customer first.", fallback: false };
      return;
    }

    if (trimmed.length > MAX_REPLY_CHARS) {
      yield { type: "error", message: `Keep replies under ${MAX_REPLY_CHARS} characters.`, fallback: false };
      return;
    }

    if (session.turns.length >= MAX_BOSS_TURNS) {
      yield { type: "error", message: "Maximum turns reached.", fallback: false };
      return;
    }

    const categoryKey = session.persona.category.slug as CategoryKey;
    const mockData = getMockPersonaData(categoryKey);
    const currentTurn = session.turns.length + 1;

    // AI mode check
    if (getAiMode() !== "real") {
      // --- Mock / offline path ---
      if (trimmed === "/fail") {
        await db.roleplaySession.update({
          where: { id: sessionId },
          data: { status: RoleplayStatus.FALLBACK },
        });
        yield {
          type: "error",
          message: "The AI customer is busy. Switching to the guided version.",
          fallback: true,
        };
        return;
      }

      const scores = judgeReply(trimmed);
      const moodDelta = Math.round((average(scores) - 5) * 5);
      const newMood = clamp(session.mood + moodDelta, 0, 100);

      let newStatus: RoleplayStatus;
      if (newMood >= 80) newStatus = RoleplayStatus.WON;
      else if (newMood <= 5) newStatus = RoleplayStatus.LOST;
      else if (currentTurn >= MAX_BOSS_TURNS) newStatus = newMood >= 60 ? RoleplayStatus.WON : RoleplayStatus.LOST;
      else newStatus = RoleplayStatus.ACTIVE;

      // Pick reply from mock persona
      let customerReply = session.persona.problem; // fallback
      if (mockData) {
        if (newStatus === RoleplayStatus.WON) {
          customerReply = mockData.won;
        } else if (newStatus === RoleplayStatus.LOST) {
          customerReply = mockData.lost;
        } else {
          const tier = newMood < 35 ? "low" : newMood < 65 ? "mid" : "high";
          const lines = mockData.replies[tier];
          customerReply = lines[(currentTurn - 1) % lines.length] ?? lines[0] ?? session.persona.problem;
        }
      }

      // Stream tokens
      const words = customerReply.split(" ");
      let chunk = "";
      for (let i = 0; i < words.length; i++) {
        chunk += (i === 0 ? "" : " ") + (words[i] ?? "");
        if (chunk.length >= 4 || i === words.length - 1) {
          await new Promise((r) => setTimeout(r, 15));
          yield { type: "token", text: chunk };
          chunk = "";
        }
      }

      // Persist turn
      await db.roleplayTurn.create({
        data: {
          sessionId,
          order: currentTurn,
          userMessage: trimmed,
          customerReply,
          moodAfter: newMood,
          empathy: scores.empathy,
          ownership: scores.ownership,
          clarity: scores.clarity,
          solution: scores.solution,
          tone: scores.tone,
          feedback: `Avg: ${average(scores).toFixed(1)}/10`,
        },
      });

      await db.roleplaySession.update({
        where: { id: sessionId },
        data: { mood: newMood, status: newStatus },
      });

      const domainStatus = newStatus.toLowerCase() as "active" | "won" | "lost" | "fallback";
      yield {
        type: "turn",
        moodAfter: newMood,
        scores,
        status: domainStatus,
        feedback: `Avg: ${average(scores).toFixed(1)}/10`,
      };
      return;
    }

    // --- Real AI path ---
    const opening = parseOpening(session.persona.systemPrompt, getMockPersonaData(session.persona.category?.slug ?? "")?.opening ?? session.persona.problem);
    const history: Array<{ role: "customer" | "user"; text: string }> = [
      { role: "customer", text: opening },
    ];
    for (const t of session.turns) {
      history.push({ role: "user", text: t.userMessage });
      history.push({ role: "customer", text: t.customerReply });
    }

    const result = await runTurn({
      persona: {
        name: session.persona.name,
        problem: session.persona.problem,
        hiddenGoal: session.persona.hiddenGoal,
        systemPrompt: session.persona.systemPrompt,
      },
      mood: session.mood,
      turn: currentTurn,
      maxTurns: MAX_BOSS_TURNS,
      history,
      userText: trimmed,
    });

    if (!result.ok) {
      await db.roleplaySession.update({
        where: { id: sessionId },
        data: { status: RoleplayStatus.FALLBACK },
      });
      yield {
        type: "error",
        message: "The AI customer is busy. Switching to the guided version.",
        fallback: true,
      };
      return;
    }

    const { customerReply, scores, outcome, feedback } = result.data;
    const newMood = result.data.mood;

    // Stream tokens (~3-6 chars per event)
    let pos = 0;
    while (pos < customerReply.length) {
      const len = 3 + Math.floor(Math.random() * 4); // 3-6 chars
      const token = customerReply.slice(pos, pos + len);
      pos += len;
      await new Promise((r) => setTimeout(r, 20));
      yield { type: "token", text: token };
    }

    // Map outcome to status
    let newStatus: RoleplayStatus;
    if (outcome === "won") newStatus = RoleplayStatus.WON;
    else if (outcome === "lost") newStatus = RoleplayStatus.LOST;
    else newStatus = RoleplayStatus.ACTIVE;

    // Persist turn
    await db.roleplayTurn.create({
      data: {
        sessionId,
        order: currentTurn,
        userMessage: trimmed,
        customerReply,
        moodAfter: newMood,
        empathy: scores.empathy,
        ownership: scores.ownership,
        clarity: scores.clarity,
        solution: scores.solution,
        tone: scores.tone,
        feedback: feedback ?? "",
      },
    });

    await db.roleplaySession.update({
      where: { id: sessionId },
      data: { mood: newMood, status: newStatus },
    });

    const domainStatus = newStatus.toLowerCase() as "active" | "won" | "lost" | "fallback";
    yield {
      type: "turn",
      moodAfter: newMood,
      scores,
      status: domainStatus,
      feedback: feedback ?? "",
    };
  },

  async finishSession(userId: string, sessionId: string): Promise<BossResult> {
    const session = await db.roleplaySession.findUnique({
      where: { id: sessionId },
      include: {
        turns: { orderBy: { order: "asc" } },
        persona: { include: { category: true } },
      },
    });

    if (!session || session.userId !== userId) throw new Error("Boss session not found");

    // Idempotent: already finished with XP
    if (session.xpEarned !== null && session.endedAt !== null) {
      const categoryKey = session.persona.category.slug as CategoryKey;

      const n = session.turns.length || 1;
      const sum = session.turns.reduce(
        (acc, t) => ({
          empathy: acc.empathy + t.empathy,
          ownership: acc.ownership + t.ownership,
          clarity: acc.clarity + t.clarity,
          solution: acc.solution + t.solution,
          tone: acc.tone + t.tone,
        }),
        { empathy: 0, ownership: 0, clarity: 0, solution: 0, tone: 0 },
      );
      const averageScores = {
        empathy: round1(sum.empathy / n),
        ownership: round1(sum.ownership / n),
        clarity: round1(sum.clarity / n),
        solution: round1(sum.solution / n),
        tone: round1(sum.tone / n),
      };

      const domainStatus = session.status.toLowerCase() as "active" | "won" | "lost" | "fallback";
      const stars = (session.stars ?? 0) as Stars;

      return {
        sessionId,
        categoryKey,
        status: domainStatus,
        stars,
        xpEarned: session.xpEarned,
        averageScores,
        weakestReply: null,
        newBadges: [],
        questsCompleted: [],
      };
    }

    // Mark ACTIVE as LOST
    if (session.status === RoleplayStatus.ACTIVE) {
      await db.roleplaySession.update({
        where: { id: sessionId },
        data: { status: RoleplayStatus.LOST },
      });
      session.status = RoleplayStatus.LOST;
    }

    const categoryKey = session.persona.category.slug as CategoryKey;
    const mockData = getMockPersonaData(categoryKey);

    const n = session.turns.length || 1;
    const sum = session.turns.reduce(
      (acc, t) => ({
        empathy: acc.empathy + t.empathy,
        ownership: acc.ownership + t.ownership,
        clarity: acc.clarity + t.clarity,
        solution: acc.solution + t.solution,
        tone: acc.tone + t.tone,
      }),
      { empathy: 0, ownership: 0, clarity: 0, solution: 0, tone: 0 },
    );
    const averageScores = {
      empathy: round1(sum.empathy / n),
      ownership: round1(sum.ownership / n),
      clarity: round1(sum.clarity / n),
      solution: round1(sum.solution / n),
      tone: round1(sum.tone / n),
    };

    const overall = average(averageScores);
    const domainStatus = session.status.toLowerCase() as "active" | "won" | "lost" | "fallback";
    const stars: Stars =
      domainStatus === "won" ? (overall >= 8 ? 3 : overall >= 6.5 ? 2 : 1) : 0;

    // Find previous best stars for this persona
    const prevBestSession = await db.roleplaySession.findFirst({
      where: {
        userId,
        personaId: session.personaId,
        status: RoleplayStatus.WON,
        stars: { not: null },
        id: { not: sessionId },
      },
      orderBy: { stars: "desc" },
    });
    const previousBestStars = (prevBestSession?.stars ?? 0) as Stars;

    const xpEarned =
      replayXp(previousBestStars, stars, session.persona.xpReward) + (stars === 0 ? 10 : 0);

    // Write XpEvent
    await db.xpEvent.create({
      data: {
        userId,
        source: XpSource.BOSS,
        amount: xpEarned,
        refId: sessionId,
      },
    });

    // Increment User xp (User model has xp field)
    await db.user.update({
      where: { id: userId },
      data: { xp: { increment: xpEarned } },
    });

    // Find weakest turn
    let weakestTurn: (typeof session.turns)[number] | null = null;
    for (const t of session.turns) {
      if (
        weakestTurn === null ||
        average({ empathy: t.empathy, ownership: t.ownership, clarity: t.clarity, solution: t.solution, tone: t.tone }) <
          average({
            empathy: weakestTurn.empathy,
            ownership: weakestTurn.ownership,
            clarity: weakestTurn.clarity,
            solution: weakestTurn.solution,
            tone: weakestTurn.tone,
          })
      ) {
        weakestTurn = t;
      }
    }

    // Persist stars/xpEarned/endedAt
    await db.roleplaySession.update({
      where: { id: sessionId },
      data: { stars, xpEarned, endedAt: new Date() },
    });

    return {
      sessionId,
      categoryKey,
      status: domainStatus,
      stars,
      xpEarned,
      averageScores,
      weakestReply: weakestTurn
        ? {
            text: weakestTurn.userMessage,
            betterReply: mockData?.betterReply ?? "Try using more empathy and offering a concrete solution.",
          }
        : null,
      newBadges: [],
      questsCompleted: [],
    };
  },
};
