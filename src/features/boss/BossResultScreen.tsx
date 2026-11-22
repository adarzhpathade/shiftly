"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { BracketHeadline, GameObject, MoodMeter, Sticker, cn } from "@/components/ui";
import type { BossResult } from "@/lib/types";
import { StarIcon } from "@/features/training/StarRow";
import { Confetti } from "@/features/training/Confetti";
import type { ChatMessage } from "./BossChat";
import { SCORE_KEYS, SCORE_LABELS } from "./helpers";

const BTN =
  "inline-flex min-h-12 w-full items-center justify-center rounded-pill px-6 text-[15px] font-bold transition-transform active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink";

const SPRING = { type: "spring", stiffness: 380, damping: 16 } as const;

export function BossResultScreen({
  result,
  finalMood,
  personaName,
  messages,
  backHref,
  retryDisabled,
  retryError,
  onRetry,
}: {
  result: BossResult;
  finalMood: number;
  personaName: string;
  messages: readonly ChatMessage[];
  backHref: string;
  retryDisabled: boolean;
  retryError: string | null;
  onRetry: () => void;
}) {
  const won = result.status === "won";
  const stars = Math.min(3, Math.max(0, result.stars));

  return (
    <section aria-label="Boss result" className="relative pt-8 pb-8">
      {won && <Confetti />}
      <p className="text-center text-[13px] font-bold tracking-[0.06em] text-ink/70 uppercase">
        {won ? "Boss beaten" : "Call ended"}
      </p>
      <BracketHeadline size="h1" highlightTone="lav-ink" className="mt-1.5 text-center">
        {won ? "You [won]" : "Try [again]"}
      </BracketHeadline>

      <div className="mt-4 flex items-end justify-center gap-3">
        {won ? (
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={SPRING}
          >
            <GameObject name="trophy" size={104} float />
          </motion.div>
        ) : null}
        <Sticker pose={won ? "cheer" : "think"} size={won ? 84 : 104} />
      </div>

      {won && (
        <div
          role="img"
          aria-label={`${stars} of 3 stars`}
          className="mt-3 flex items-end justify-center gap-2"
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              initial={{ scale: 0, rotate: -40, opacity: 0 }}
              animate={{ scale: 1, rotate: i === 1 ? 0 : i === 0 ? -8 : 8, opacity: 1 }}
              transition={{ ...SPRING, delay: 0.25 + i * 0.25 }}
              className={cn(i === 1 && "-translate-y-2")}
            >
              <StarIcon filled={i < stars} size={i === 1 ? 52 : 42} />
            </motion.span>
          ))}
        </div>
      )}

      <p className="mt-3 text-center text-sm font-medium text-ink/80">
        {won
          ? `${personaName} hung up happy. Great call.`
          : `${personaName} was not convinced this time. Check the tips below and go again.`}
      </p>

      <MoodMeter value={finalMood} label="Final mood" className="mt-4" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.6 }}
        className="mt-3 rounded-card bg-ink p-4 text-cream"
      >
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] font-bold">XP earned</span>
          <span className="text-[26px] leading-none font-extrabold tracking-[-0.03em] text-lime">
            +{result.xpEarned} XP
          </span>
        </div>
        {result.xpEarned === 0 && (
          <p className="mt-2 text-xs font-semibold text-cream/75">Replays of a mastered boss earn no extra XP.</p>
        )}
      </motion.div>

      <div className="mt-3 rounded-card bg-paper p-4">
        <p className="text-[13px] font-bold tracking-[0.06em] text-ink/70 uppercase">How you did</p>
        <ul className="mt-3 flex flex-col gap-2.5">
          {SCORE_KEYS.map((k, i) => {
            const v = result.averageScores[k];
            return (
              <li key={k}>
                <div className="flex justify-between text-[13px] font-bold">
                  <span>{SCORE_LABELS[k]}</span>
                  <span className="text-ink-soft">{v.toFixed(1)}/10</span>
                </div>
                <div
                  role="meter"
                  aria-label={SCORE_LABELS[k]}
                  aria-valuemin={0}
                  aria-valuemax={10}
                  aria-valuenow={v}
                  className="mt-1 h-2.5 overflow-hidden rounded-pill bg-muted"
                >
                  <motion.span
                    className={cn("block h-full rounded-pill", v >= 7 ? "bg-lime" : v >= 4.5 ? "bg-xp-gold" : "bg-red")}
                    initial={{ width: 0 }}
                    animate={{ width: `${(v / 10) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.5 + i * 0.1, ease: "easeOut" }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {result.weakestReply && (
        <div className="mt-3 rounded-card bg-paper p-4 text-[13px] leading-[1.35]">
          <p className="text-[13px] font-bold tracking-[0.06em] text-ink/70 uppercase">Judge summary</p>
          <p className="mt-2 font-semibold">Your weakest reply</p>
          <p className="mt-0.5 rounded-[14px] bg-peach px-3 py-2 font-medium break-words">{result.weakestReply.text}</p>
          <p className="mt-2 font-semibold">A stronger way to say it</p>
          <p className="mt-0.5 rounded-[14px] bg-lime px-3 py-2 font-medium break-words">{result.weakestReply.betterReply}</p>
        </div>
      )}

      {result.leveledUp && (
        <p className="mt-3 rounded-card bg-lime p-3.5 text-center text-[15px] font-extrabold">
          Level up! You are now level {result.leveledUp.newLevel}
        </p>
      )}
      {result.newBadges.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {result.newBadges.map((b) => (
            <li key={b.key} className="rounded-card bg-paper p-3.5 text-sm">
              <b>New badge: {b.name}</b>
              <span className="block text-xs font-medium text-ink-soft">{b.description}</span>
            </li>
          ))}
        </ul>
      )}

      {messages.length > 0 && (
        <details className="mt-3 rounded-card bg-paper p-3.5">
          <summary className="cursor-pointer text-sm font-bold">Show transcript</summary>
          <ol className="mt-3 flex flex-col gap-2">
            {messages.map((m) => (
              <li key={m.id} className="text-[13px] leading-[1.35]">
                <b className="mr-1.5">{m.role === "user" ? "You" : personaName}:</b>
                <span className="font-medium break-words">{m.text}</span>
              </li>
            ))}
          </ol>
        </details>
      )}

      <div className="mt-6 flex flex-col gap-2.5">
        {retryError && (
          <p role="alert" className="rounded-card bg-paper p-3 text-center text-sm font-bold text-red">
            {retryError}
          </p>
        )}
        <button
          type="button"
          onClick={onRetry}
          disabled={retryDisabled}
          className={cn(BTN, "bg-lime text-ink disabled:opacity-60")}
        >
          {retryDisabled ? "Connecting…" : "Retry the call"}
        </button>
        <Link href={backHref} className={cn(BTN, "text-ink underline")}>
          Back to path
        </Link>
      </div>
    </section>
  );
}
