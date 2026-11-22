import { BOSS_DAILY_LIMIT, MAX_BOSS_TURNS, MAX_REPLY_CHARS, addDays, levelForXp, replayXp } from "@/lib/gamification";
import type { Stars } from "@/lib/gamification";
import type { BossResult, BossSession, BossStreamEvent, TurnScores } from "@/lib/types";
import type { BossRepository } from "../repositories";
import { BOSS_PERSONAS, type BossPersonaDef } from "./data";
import { delay, tokenDelay } from "./delay";
import { awardBadges, bestStars, bumpQuests, grantXp, nextId, personaFor, starKey, state, touchActivity, today, SCENARIOS, type BossRecord } from "./state";

const BOSS_BASE_XP = 100;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function count(text: string, words: readonly string[]): number {
  return words.filter((w) => text.includes(w)).length;
}

/** Cheap keyword "judge" standing in for the AI judge. Scores each 0 to 10. */
export function judgeReply(raw: string): TurnScores {
  const t = raw.toLowerCase();
  const wordCount = raw.trim().split(/\s+/).filter(Boolean).length;
  const rude = count(t, ["calm down", "not my", "whatever", "your fault", "can't help", "cannot help"]);
  const shouting = (raw.match(/!/g)?.length ?? 0) + (raw.length > 6 && raw === raw.toUpperCase() ? 3 : 0);
  return {
    empathy: clamp(3 + 3 * count(t, ["sorry", "apolog", "understand", "frustrat", "hear you", "must be", "right to be"]) + count(t, ["thank"]) - rude * 2, 0, 10),
    ownership: clamp(3 + 3 * count(t, ["i will", "i'll", "let me", "personally", "i'm going to", "i can", "i've raised", "i own"]) - rude * 2, 0, 10),
    clarity: clamp(wordCount < 4 ? 2 : wordCount <= 70 ? 7 : 5, 0, 10),
    solution: clamp(2 + 2 * count(t, ["refund", "replace", "within", "tomorrow", "today", "reference", "escalate", "check", "fix", "call you back", "follow up", "option"]), 0, 10),
    tone: clamp(8 - shouting * 2 - rude * 3, 0, 10),
  };
}

function average(s: TurnScores): number {
  return (s.empathy + s.ownership + s.clarity + s.solution + s.tone) / 5;
}

function toSession(rec: BossRecord, persona: BossPersonaDef): BossSession {
  return {
    id: rec.id,
    persona: {
      id: persona.id,
      categoryKey: persona.categoryKey,
      name: persona.name,
      problem: persona.problem,
      avatarKey: persona.avatarKey,
      startMood: persona.startMood,
    },
    mood: rec.mood,
    turn: rec.turn,
    maxTurns: 8,
    status: rec.status,
    messages: rec.messages.map((m) => ({ ...m })),
    quickReplies: persona.quickReplies,
    fallbackScenarioId:
      rec.status === "fallback"
        ? (Object.values(SCENARIOS).find((s) => s.categoryKey === persona.categoryKey && s.level === 1)?.id ?? null)
        : null,
  };
}

function getRecord(userId: string, sessionId: string): { rec: BossRecord; persona: BossPersonaDef } {
  const rec = state.bossSessions.get(sessionId);
  if (!rec || rec.userId !== userId) throw new Error(`Boss session not found: ${sessionId}`);
  const persona = BOSS_PERSONAS.find((p) => p.id === rec.personaId);
  if (!persona) throw new Error("Persona missing");
  return { rec, persona };
}

function pickReply(persona: BossPersonaDef, rec: BossRecord): string {
  if (rec.status === "won") return persona.won;
  if (rec.status === "lost") return persona.lost;
  const tier = rec.mood < 35 ? "low" : rec.mood < 65 ? "mid" : "high";
  const lines = persona.replies[tier];
  return lines[(rec.turn - 1) % lines.length] ?? lines[0] ?? "";
}

function tokenize(text: string): string[] {
  return text.split(" ").map((w, i) => (i === 0 ? w : ` ${w}`));
}

export const mockBossRepo: BossRepository = {
  async startSession(userId, categoryKey) {
    await delay();
    const day = today();
    const used = state.bossStarts[day] ?? 0;
    if (used >= BOSS_DAILY_LIMIT) {
      const [y, m, d] = addDays(day, 1).split("-").map(Number);
      return { ok: false, reason: "daily-limit", resetsAt: new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).toISOString() };
    }
    state.bossStarts[day] = used + 1;
    const persona = personaFor(categoryKey);
    const rec: BossRecord = {
      id: nextId("boss"),
      userId,
      personaId: persona.id,
      mood: persona.startMood,
      turn: 0,
      status: "active",
      messages: [{ role: "customer", text: persona.opening }],
      turns: [],
      result: null,
    };
    state.bossSessions.set(rec.id, rec);
    return { ok: true, session: toSession(rec, persona), attemptsLeftToday: BOSS_DAILY_LIMIT - used - 1 };
  },

  async getSession(userId, sessionId) {
    await delay();
    const { rec, persona } = getRecord(userId, sessionId);
    return toSession(rec, persona);
  },

  /**
   * Scripted call. Send "/fail" as the message to simulate the AI being down
   * (yields an error event with fallback: true).
   */
  async *sendMessage(userId, sessionId, text): AsyncGenerator<BossStreamEvent> {
    await delay();
    const { rec, persona } = getRecord(userId, sessionId);
    if (rec.status !== "active") {
      yield { type: "error", message: "This call has already ended.", fallback: false };
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) {
      yield { type: "error", message: "Say something to the customer first.", fallback: false };
      return;
    }
    if (trimmed === "/fail") {
      rec.status = "fallback";
      yield { type: "error", message: "The AI customer is unavailable. Switching to multiple choice.", fallback: true };
      return;
    }
    if (trimmed.length > MAX_REPLY_CHARS) {
      yield { type: "error", message: `Keep replies under ${MAX_REPLY_CHARS} characters.`, fallback: false };
      return;
    }
    const clipped = trimmed;
    rec.messages.push({ role: "user", text: clipped });
    rec.turn += 1;

    const scores = judgeReply(clipped);
    rec.turns.push({ userText: clipped, scores });
    rec.mood = clamp(rec.mood + Math.round((average(scores) - 5) * 5), 0, 100);
    if (rec.mood >= 80) rec.status = "won";
    else if (rec.mood <= 5) rec.status = "lost";
    else if (rec.turn >= MAX_BOSS_TURNS) rec.status = rec.mood >= 60 ? "won" : "lost";

    const reply = pickReply(persona, rec);
    for (const token of tokenize(reply)) {
      await tokenDelay();
      yield { type: "token", text: token };
    }
    rec.messages.push({ role: "customer", text: reply });
    yield { type: "turn", moodAfter: rec.mood, scores, status: rec.status };
  },

  async finishSession(userId, sessionId): Promise<BossResult> {
    await delay();
    const { rec, persona } = getRecord(userId, sessionId);
    if (rec.result) return rec.result;
    if (rec.status === "active") rec.status = "lost";

    const n = rec.turns.length || 1;
    const sum = rec.turns.reduce(
      (acc, t) => ({
        empathy: acc.empathy + t.scores.empathy,
        ownership: acc.ownership + t.scores.ownership,
        clarity: acc.clarity + t.scores.clarity,
        solution: acc.solution + t.scores.solution,
        tone: acc.tone + t.scores.tone,
      }),
      { empathy: 0, ownership: 0, clarity: 0, solution: 0, tone: 0 },
    );
    const averageScores: TurnScores = {
      empathy: round1(sum.empathy / n),
      ownership: round1(sum.ownership / n),
      clarity: round1(sum.clarity / n),
      solution: round1(sum.solution / n),
      tone: round1(sum.tone / n),
    };
    const overall = average(averageScores);
    const stars: Stars = rec.status === "won" ? (overall >= 8 ? 3 : overall >= 6.5 ? 2 : 1) : 0;

    const weakest = rec.turns.reduce<BossRecord["turns"][number] | null>(
      (min, t) => (min === null || average(t.scores) < average(min.scores) ? t : min),
      null,
    );

    const previous = bestStars(persona.categoryKey, 5);
    const xpEarned = replayXp(previous, stars, BOSS_BASE_XP) + (stars === 0 ? 10 : 0);
    state.stars[starKey(persona.categoryKey, 5)] = Math.max(previous, stars) as Stars;
    touchActivity();

    const before = levelForXp(state.user.xp);
    grantXp(xpEarned);
    const questsCompleted = [...bumpQuests("scenario"), ...(stars >= 2 ? bumpQuests("stars") : [])];
    const after = levelForXp(state.user.xp);

    const badgeKeys: string[] = [];
    if (rec.status === "won") badgeKeys.push("boss-slayer");
    if (stars === 3) badgeKeys.push("perfect-score");

    const result: BossResult = {
      sessionId,
      categoryKey: persona.categoryKey,
      status: rec.status,
      stars,
      xpEarned,
      averageScores,
      weakestReply: weakest ? { text: weakest.userText, betterReply: persona.betterReply } : null,
      ...(after > before ? { leveledUp: { newLevel: after } } : {}),
      newBadges: awardBadges(badgeKeys),
      questsCompleted,
    };
    rec.result = result;
    return result;
  },
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
