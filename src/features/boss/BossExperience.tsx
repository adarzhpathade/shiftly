"use client";

import { useCallback, useState } from "react";
import { ContextLoader, ThemeColor, cn } from "@/components/ui";
import { TONE_BG } from "@/features/training/tones";
import type { BossResult, BossSession, BossStatus } from "@/lib/types";
import { BossChat, type ChatMessage } from "./BossChat";
import { BossIntro } from "./BossIntro";
import { BossResultScreen } from "./BossResultScreen";
import { streamTurn } from "./helpers";
import type { BossExperienceProps, BossSendFn } from "./types";

type Phase =
  | { kind: "intro" }
  | { kind: "chat"; session: BossSession; messages?: ChatMessage[] }
  | { kind: "finishing" }
  | { kind: "result"; result: BossResult; mood: number; messages: ChatMessage[] };

/** Full-screen boss level: intro, live call, result. Covers the tab bar like the scenario player. */
export function BossExperience({
  categoryKey,
  categoryName,
  colorToken,
  persona,
  gate,
  lockedHref,
  resetsAt,
  backHref,
  fallbackHref,
  maxTurns,
  maxChars,
  onStart,
  onFinish,
  onSend,
}: BossExperienceProps) {
  const [phase, setPhase] = useState<Phase>({ kind: "intro" });
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitHit, setLimitHit] = useState<string | null>(null);

  const start = useCallback(async () => {
    setStarting(true);
    setError(null);
    let res;
    try {
      res = await onStart(categoryKey);
    } catch {
      res = { ok: false as const, error: "Could not start the call." };
    }
    setStarting(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (!res.result.ok) {
      setLimitHit(res.result.resetsAt);
      setError("You have used today's boss calls.");
      setPhase({ kind: "intro" });
      return;
    }
    const session = res.result.session;
    setPhase({ kind: "chat", session });
  }, [categoryKey, onStart]);

  const end = useCallback(
    async (session: BossSession, messages: ChatMessage[], _status: BossStatus, mood: number) => {
      setPhase({ kind: "finishing" });
      let res;
      try {
        res = await onFinish(session.id);
      } catch {
        res = { ok: false as const, error: "Could not load your result." };
      }
      if (!res.ok) {
        setError(res.error);
        setPhase({
          kind: "chat",
          session: { ...session, status: _status, mood, turn: messages.filter((m) => m.role === "user").length },
          messages,
        });
        return;
      }
      setPhase({ kind: "result", result: res.result, mood, messages });
    },
    [onFinish],
  );

  const send: BossSendFn =
    onSend ??
    ((sessionId, text, onEvent) =>
      streamTurn(`/api/boss/${encodeURIComponent(sessionId)}/message`, text, onEvent));

  const effectiveGate = limitHit ? "limit" : gate;

  return (
    <div
      data-category-color={colorToken}
      className={cn("fixed inset-0 z-[60] flex flex-col overflow-hidden", TONE_BG[colorToken])}
    >
      <ThemeColor color={colorToken} />
      {phase.kind === "chat" ? (
        <BossChat
          key={phase.session.id}
          session={phase.session}
          personaName={persona.name}
          backHref={backHref}
          fallbackHref={fallbackHref}
          maxChars={maxChars}
          send={send}
          initialMessages={phase.messages}
          onEnded={(messages, status, mood) => void end(phase.session, messages, status, mood)}
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          <div className="mx-auto flex min-h-full max-w-md flex-col px-gutter pt-5 pb-8">
            {phase.kind === "intro" && (
              <BossIntro
                categoryName={categoryName}
                persona={persona}
                gate={effectiveGate}
                lockedHref={lockedHref}
                resetsAt={limitHit ?? resetsAt}
                backHref={backHref}
                maxTurns={maxTurns}
                maxChars={maxChars}
                starting={starting}
                error={limitHit ? null : error}
                onStart={() => void start()}
              />
            )}
            {phase.kind === "finishing" && (
              <div aria-busy="true" aria-label="Scoring your call" className="mt-10">
                <ContextLoader variant="scene" label="Scoring your call…" />
              </div>
            )}
            {phase.kind === "result" && (
              <BossResultScreen
                result={phase.result}
                finalMood={phase.mood}
                personaName={persona.name}
                messages={phase.messages}
                backHref={backHref}
                retryDisabled={starting}
                retryError={error}
                onRetry={() => void start()}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
