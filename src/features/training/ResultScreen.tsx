"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { BracketHeadline, Sticker, cn } from "@/components/ui";
import type { ScenarioResult } from "@/lib/types";
import { Confetti } from "./Confetti";
import { StarIcon } from "./StarRow";

const HEADLINE = [
  "Keep [going]",
  "Good [start]",
  "Nice [work]",
  "[Perfect]",
] as const;

const RATING_TONE = {
  best: "bg-lime",
  okay: "bg-peach",
  poor: "bg-muted",
} as const;

const SPRING = { type: "spring", stiffness: 380, damping: 16 } as const;

const BTN =
  "inline-flex min-h-12 w-full items-center justify-center rounded-pill px-6 text-[15px] font-bold transition-transform active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink";

export function ResultScreen({
  result,
  nextHref,
  backHref,
  onReplay,
}: {
  result: ScenarioResult;
  nextHref: string | null;
  backHref: string;
  onReplay: () => void;
}) {
  const stars = Math.min(3, Math.max(0, result.stars));
  const pct = result.maxScore > 0 ? (result.score / result.maxScore) * 100 : 0;

  return (
    <section aria-label="Scenario result"className="relative px-gutter pt-10 pb-8">
      {stars >= 1 && <Confetti />}
      <p className="text-center text-[13px] font-bold tracking-[0.06em] uppercase text-ink/70">
        Scenario complete
      </p>
      <BracketHeadline
        size="h1"
        highlightTone="lav-ink"
        className="mt-1.5 text-center"
      >
        {HEADLINE[stars] ?? HEADLINE[0]}
      </BracketHeadline>

      <div
        role="img"
        aria-label={`${stars} of 3 stars`}
        className="mt-6 flex items-end justify-center gap-2"
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            aria-hidden="true"
            initial={{ scale: 0, rotate: -40, opacity: 0 }}
            animate={{ scale: 1, rotate: i === 1 ? 0 : i === 0 ? -8 : 8, opacity: 1 }}
            transition={{ ...SPRING, delay: 0.25 + i * 0.28 }}
            className={cn(i === 1 && "-translate-y-3")}
          >
            <StarIcon filled={i < stars} size={i === 1 ? 92 : 76} />
          </motion.span>
        ))}
      </div>

      <div className="mt-4 flex justify-center">
        <Sticker pose={stars >= 2 ? "cheer" : "think"} size={96} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24, delay: 1.0 }}
        className="mt-3 rounded-card bg-ink p-4 text-cream"
      >
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] font-bold">XP earned</span>
          <span className="text-[26px] leading-none font-extrabold tracking-[-0.03em] text-lime">
            +{result.xpEarned} XP
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Score"
          aria-valuemin={0}
          aria-valuemax={result.maxScore}
          aria-valuenow={result.score}
          className="mt-3 h-2.5 overflow-hidden rounded-pill bg-cream/20"
        >
          <motion.span
            className="block h-full rounded-pill bg-lime"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.1, delay: 1.2, ease: "easeOut" }}
          />
        </div>
        <p className="mt-2 text-xs font-semibold text-cream/75">
          Score {result.score} / {result.maxScore}
        </p>
      </motion.div>

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

      {result.questsCompleted.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {result.questsCompleted.map((q) => (
            <li key={q.id} className="rounded-card bg-sky p-3.5 text-sm font-bold">
              Quest done: {q.label}
              <span className="ml-2 font-semibold text-ink/70">+{q.xpReward} XP</span>
            </li>
          ))}
        </ul>
      )}

      {result.perStep.length > 0 && (
        <details className="mt-3 rounded-card bg-paper p-3.5">
          <summary className="cursor-pointer text-sm font-bold">Review your answers</summary>
          <ol className="mt-3 flex flex-col gap-2.5">
            {result.perStep.map((s, i) => (
              <li key={s.stepId} className="text-[13px] leading-[1.35]">
                <span
                  className={cn(
                    "mr-2 inline-block rounded-pill px-2.5 py-0.5 text-[11px] font-extrabold uppercase",
                    RATING_TONE[s.rating],
                  )}
                >
                  {i + 1}. {s.rating}
                </span>
                <span className="font-medium">{s.choiceText}</span>
                <span className="mt-0.5 block text-ink-soft">{s.feedback}</span>
              </li>
            ))}
          </ol>
        </details>
      )}

      <div className="mt-6 flex flex-col gap-2.5">
        {nextHref && (
          <Link href={nextHref} className={cn(BTN, "bg-lime text-ink")}>
            Next level
          </Link>
        )}
        <button type="button" onClick={onReplay} className={cn(BTN, "bg-paper text-ink")}>
          Replay
        </button>
        <Link href={backHref} className={cn(BTN, "text-ink underline")}>
          Back to path
        </Link>
      </div>
    </section>
  );
}
