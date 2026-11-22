"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { MoodMeter, Sticker, cn } from "@/components/ui";
import type { BossGate, BossIntroPersona } from "./types";

const BTN =
  "inline-flex min-h-14 w-full items-center justify-center rounded-pill px-6 text-base font-bold transition-transform active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink";

const SPRING = { type: "spring", stiffness: 300, damping: 24 } as const;

function formatReset(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
}

export function BossIntro({
  categoryName,
  persona,
  gate,
  lockedHref,
  resetsAt,
  backHref,
  maxTurns,
  maxChars,
  starting,
  error,
  onStart,
}: {
  categoryName: string;
  persona: BossIntroPersona;
  gate: BossGate;
  lockedHref: string;
  resetsAt?: string;
  backHref: string;
  maxTurns: number;
  maxChars: number;
  starting: boolean;
  error: string | null;
  onStart: () => void;
}) {
  const reset = formatReset(resetsAt);
  return (
    <section aria-label="Boss level" className="flex flex-col gap-3 pt-2">
      <p className="text-[13px] font-bold tracking-[0.06em] text-ink/70 uppercase">
        Boss level · {categoryName}
      </p>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className="relative rounded-card bg-paper p-5"
      >
        <div className="flex items-center gap-4">
          <div className="grid size-[84px] flex-none place-items-center rounded-full bg-ink/5">
            <Sticker pose={gate === "locked" ? "think" : "headset"} size={72} />
          </div>
          <div className="min-w-0">
            <h1 className="text-[30px] leading-[0.95] font-extrabold tracking-[-0.035em] break-words">
              {persona.name}
            </h1>
            <p className="mt-1 text-xs font-bold text-ink-soft">Angry caller on the line</p>
          </div>
        </div>
        <p className="mt-4 text-[15px] leading-[1.4] font-medium">{persona.problem}</p>
        <MoodMeter value={persona.startMood} label="Starting mood" className="mt-4 bg-cream" />
        <p className="mt-4 rounded-[18px] bg-lime px-4 py-3 text-sm leading-[1.35] font-bold">
          Your goal: {persona.goalHint}
        </p>
      </motion.div>

      <div className="rounded-card bg-paper/70 p-4">
        <p className="text-[13px] font-bold tracking-[0.06em] text-ink/70 uppercase">How it works</p>
        <ul className="mt-2 flex flex-col gap-1.5 text-sm leading-[1.35] font-medium">
          <li>You have up to {maxTurns} replies to turn the call around.</li>
          <li>Each reply is scored live. Mood 80+ wins, mood 5 or less loses.</li>
          <li>Keep replies under {maxChars} characters. Short and warm beats long.</li>
          <li>Tip: say sorry, own the problem, give a clear next step.</li>
        </ul>
      </div>

      {gate === "locked" && (
        <div role="status" className="rounded-card bg-paper p-4 text-center">
          <p className="text-[15px] font-extrabold">Boss is locked</p>
          <p className="mt-1 text-[13px] font-medium text-ink-soft">
            Finish levels 1 to 4 first to unlock this call.
          </p>
          <Link href={lockedHref} className={cn(BTN, "mt-3 bg-ink text-cream")}>
            Go to the levels
          </Link>
        </div>
      )}

      {gate === "limit" && (
        <div role="status" className="rounded-card bg-paper p-4 text-center">
          <p className="text-[15px] font-extrabold">You have used today&apos;s boss calls</p>
          <p className="mt-1 text-[13px] font-medium text-ink-soft">
            {reset ? `More calls open tomorrow at ${reset}.` : "Come back tomorrow for more calls."} Practice a
            guided level in the meantime.
          </p>
        </div>
      )}

      {gate === "ok" && (
        <>
          {error && (
            <p role="alert" className="rounded-card bg-paper p-3.5 text-center text-sm font-bold text-red">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={onStart}
            disabled={starting}
            className={cn(BTN, "bg-ink text-cream disabled:opacity-60")}
          >
            {starting ? "Connecting…" : "Start call"}
          </button>
        </>
      )}

      <Link href={backHref} className={cn(BTN, "min-h-12 text-ink underline")}>
        Back to path
      </Link>
    </section>
  );
}
