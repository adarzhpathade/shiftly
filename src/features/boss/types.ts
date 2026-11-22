import type { BossResult, BossStartResult, BossStreamEvent, ColorToken } from "@/lib/types";

type Fail = { ok: false; error: string };

export type BossStartFn = (categoryKey: string) => Promise<{ ok: true; result: BossStartResult } | Fail>;
export type BossFinishFn = (sessionId: string) => Promise<{ ok: true; result: BossResult } | Fail>;
export type BossSendFn = (sessionId: string, text: string, onEvent: (e: BossStreamEvent) => void) => Promise<void>;

export type BossIntroPersona = {
  name: string;
  problem: string;
  startMood: number;
  /** Second-person hint, e.g. "Calm them down and ...". */
  goalHint: string;
};

export type BossGate = "ok" | "locked" | "limit";

export type BossExperienceProps = {
  categoryKey: string;
  categoryName: string;
  colorToken: ColorToken;
  persona: BossIntroPersona;
  gate: BossGate;
  /** Locked state: where to send the learner. */
  lockedHref: string;
  /** Limit state: when attempts return (ISO), optional. */
  resetsAt?: string;
  backHref: string;
  /** Guided multiple-choice version, used when the AI is unavailable. */
  fallbackHref: string;
  maxTurns: number;
  maxChars: number;
  onStart: BossStartFn;
  onFinish: BossFinishFn;
  /** Defaults to the NDJSON route. Injectable for tests. */
  onSend?: BossSendFn;
};
