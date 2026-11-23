"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChatBubble, MoodMeter, Sticker, TypingBubble, cn } from "@/components/ui";
import type { BossSession, BossStatus, BossStreamEvent } from "@/lib/types";
import { averageScore, chipTone, reactionFor, turnTip, type ChipTone } from "./helpers";
import type { BossSendFn } from "./types";

export type ChatMessage = {
  id: number;
  role: "customer" | "user";
  text: string;
  /** Per-turn mini feedback shown under the user's message. */
  chip?: { score: number; tip: string; tone: ChipTone };
};

const CHIP_TONE: Record<ChipTone, string> = {
  great: "bg-lime",
  ok: "bg-xp-gold/60",
  weak: "bg-peach",
};

export function toChatMessages(session: BossSession): ChatMessage[] {
  return session.messages.map((m, i) => ({ id: i, role: m.role, text: m.text }));
}

export function BossChat({
  session,
  personaName,
  backHref,
  fallbackHref,
  maxChars,
  send,
  onEnded,
  initialMessages,
}: {
  session: BossSession;
  personaName: string;
  backHref: string;
  fallbackHref: string;
  maxChars: number;
  send: BossSendFn;
  onEnded: (messages: ChatMessage[], status: BossStatus, mood: number) => void;
  initialMessages?: ChatMessage[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => initialMessages ?? toChatMessages(session));
  const [mood, setMood] = useState(session.mood);
  const [turn, setTurn] = useState(session.turn);
  const [status, setStatus] = useState<BossStatus>(session.status);
  const [draft, setDraft] = useState("");
  const [phase, setPhase] = useState<"idle" | "typing" | "streaming">("idle");
  const [error, setError] = useState<string | null>(null);
  const [reaction, setReaction] = useState<{ id: number; emoji: string } | null>(null);
  const idRef = useRef(messages.length);
  const moodRef = useRef(session.mood);
  const endRef = useRef<HTMLDivElement>(null);
  const busy = phase !== "idle";
  const ended = status !== "active";
  const fellBack = status === "fallback";

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, phase, error, status]);

  useEffect(() => {
    if (!reaction) return;
    const t = setTimeout(() => setReaction(null), 1400);
    return () => clearTimeout(t);
  }, [reaction]);

  const submit = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || busy || ended || text.length > maxChars) return;
      setError(null);
      setDraft("");
      const userId = idRef.current++;
      const customerId = idRef.current++;
      setMessages((m) => [...m, { id: userId, role: "user", text }]);
      setPhase("typing");

      const onEvent = (e: BossStreamEvent) => {
        if (e.type === "token") {
          setPhase("streaming");
          setMessages((m) =>
            m.some((x) => x.id === customerId)
              ? m.map((x) => (x.id === customerId ? { ...x, text: x.text + e.text } : x))
              : [...m, { id: customerId, role: "customer", text: e.text }],
          );
        } else if (e.type === "turn") {
          const delta = e.moodAfter - moodRef.current;
          moodRef.current = e.moodAfter;
          setMood(e.moodAfter);
          setTurn((t) => t + 1);
          setStatus(e.status);
          const avg = averageScore(e.scores);
          setMessages((m) =>
            m.map((x) =>
              x.id === userId
                ? { ...x, chip: { score: avg, tip: turnTip(e.scores, e.feedback), tone: chipTone(avg) } }
                : x,
            ),
          );
          const emoji = reactionFor(delta);
          if (emoji) setReaction({ id: customerId, emoji });
        } else {
          if (e.fallback) setStatus("fallback");
          else {
            // the message did not count: put it back in the box
            setMessages((m) => m.filter((x) => x.id !== userId && x.id !== customerId));
            setDraft(text);
          }
          setError(e.message);
        }
      };

      try {
        await send(session.id, text, onEvent);
      } catch {
        setMessages((m) => m.filter((x) => x.id !== userId));
        setDraft(text);
        setError("Connection lost. Try again.");
      }
      setPhase("idle");
    },
    [busy, ended, maxChars, send, session.id],
  );

  const over = draft.length > maxChars;
  const remaining = maxChars - draft.length;
  const canSend = !busy && !ended && draft.trim().length > 0 && !over;
  const won = status === "won";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex-none px-gutter pt-4 pb-2">
        <div className="flex items-center gap-2.5">
          <Link
            href={backHref}
            aria-label="Leave call"
            className="grid size-10 flex-none place-items-center rounded-full bg-paper"
          >
            <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </Link>
          <div className="relative min-w-0 flex-1">
            <MoodMeter value={mood} label={personaName} />
            <AnimatePresence>
              {reaction && (
                <motion.span
                  key={reaction.id}
                  aria-hidden="true"
                  initial={{ opacity: 0, y: 6, scale: 0.6 }}
                  animate={{ opacity: 1, y: -26, scale: 1.25 }}
                  exit={{ opacity: 0, y: -44 }}
                  transition={{ duration: 0.5 }}
                  className="pointer-events-none absolute right-3 -bottom-1 text-[30px] leading-none"
                >
                  {reaction.emoji}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <span
            className="flex-none rounded-pill bg-paper px-3 py-2 text-[13px] font-bold"
            aria-label={`${Math.min(turn, session.maxTurns)} of ${session.maxTurns} replies used`}
          >
            {Math.min(turn, session.maxTurns)}/{session.maxTurns}
          </span>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-gutter pb-6" aria-live="polite">
        <ul className="flex flex-col gap-2.5 pt-2">
          {messages.map((m) => (
            <motion.li
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              className="flex flex-col"
            >
              <ChatBubble from={m.role} className="break-words whitespace-pre-wrap">
                {m.text}
              </ChatBubble>
              {m.chip && (
                <motion.p
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "mt-1.5 ml-auto flex max-w-[88%] items-start gap-2 rounded-[14px] px-3 py-1.5 text-xs leading-[1.3] font-semibold",
                    CHIP_TONE[m.chip.tone],
                  )}
                >
                  <b className="flex-none font-extrabold">{m.chip.score.toFixed(1)}/10</b>
                  <span>{m.chip.tip}</span>
                </motion.p>
              )}
            </motion.li>
          ))}
          {phase === "typing" && (
            <li>
              <TypingBubble />
            </li>
          )}
        </ul>

        {fellBack && (
          <div role="alert" className="mt-4 rounded-card bg-paper p-5 text-center">
            <Sticker pose="think" size={64} className="mx-auto" />
            <p className="mt-2 text-[15px] font-extrabold">AI is busy right now</p>
            <p className="mt-1 text-[13px] font-medium text-ink-soft">
              {error ?? "The customer could not pick up. Switch to the guided version."}
            </p>
            <Link
              href={fallbackHref}
              className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-pill bg-ink px-6 text-[15px] font-bold text-cream"
            >
              Switch to the guided version
            </Link>
          </div>
        )}

        {ended && !fellBack && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-card bg-paper p-4 text-center"
          >
            <p className="text-[15px] font-extrabold">
              {won ? "The customer is happy. You won!" : "The call has ended."}
            </p>
            <button
              type="button"
              onClick={() => onEnded(messages, status, mood)}
              className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-pill bg-ink px-6 text-[15px] font-bold text-cream active:scale-[0.97]"
            >
              See result
            </button>
          </motion.div>
        )}
        <div ref={endRef} />
      </div>

      {!ended && (
        <form
          className="flex-none px-gutter pt-2 pb-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit(draft);
          }}
        >
          {error && (
            <p role="alert" className="mb-2 rounded-[14px] bg-paper px-3 py-2 text-center text-[13px] font-bold text-red">
              {error}
            </p>
          )}
          {!busy && turn === 0 && session.quickReplies.length > 0 && (
            <div className="-mx-gutter mb-2 flex gap-2 overflow-x-auto px-gutter pb-1">
              {session.quickReplies.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setDraft(q)}
                  className="w-[70%] flex-none rounded-[16px] bg-paper px-3.5 py-2 text-left text-[13px] leading-[1.25] font-semibold"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1 rounded-[22px] bg-paper px-4 py-2.5">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void submit(draft);
                  }
                }}
                disabled={busy}
                rows={2}
                aria-label="Your reply"
                placeholder="Type your reply…"
                className="block max-h-28 w-full resize-none bg-transparent text-base leading-[1.35] font-medium outline-none placeholder:text-ink/40 disabled:opacity-60"
              />
              <p className={cn("mt-0.5 text-right text-[11px] font-bold", over ? "text-red" : "text-ink-soft")}>
                {remaining}
              </p>
            </div>
            <button
              type="submit"
              disabled={!canSend}
              aria-label="Send reply"
              className="grid size-12 flex-none place-items-center rounded-full bg-ink text-cream transition-transform active:scale-90 disabled:opacity-35"
            >
              <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
