"use client";

import { motion } from "motion/react";
import { useEffect, useId, useRef } from "react";
import { BracketHeadline, Button, GAME_OBJECT_NAMES, GameObject, useThemeColor, type GameObjectName } from "@/components/ui";
import type { CelebrationEvent } from "@/lib/celebrations";
import { Confetti, Sparkles } from "./Confetti";

type Theme = {
  bg: string;
  colour: "lav" | "lime" | "peach" | "sky";
  object: GameObjectName;
  headline: string;
  title: string;
  detail: string;
  chip: string | null;
  cta: string;
  spin: boolean;
};

function isObject(key: string): key is GameObjectName {
  return (GAME_OBJECT_NAMES as readonly string[]).includes(key);
}

export function themeFor(event: CelebrationEvent): Theme {
  switch (event.type) {
    case "level-up":
      return {
        bg: "bg-lav",
        colour: "lav",
        object: "trophy",
        headline: "LEVEL\n[UP!]",
        title: `You reached level ${event.level}`,
        detail: "Keep the momentum going. New heights ahead.",
        chip: `Level ${event.level}`,
        cta: "Nice!",
        spin: false,
      };
    case "badge":
      return {
        bg: "bg-lime",
        colour: "lime",
        object: isObject(event.badge.objectKey) ? event.badge.objectKey : "medal",
        headline: "NEW\n[BADGE!]",
        title: event.badge.name,
        detail: event.badge.description,
        chip: "Badge unlocked",
        cta: "Nice!",
        spin: true,
      };
    case "streak":
      return {
        bg: "bg-peach",
        colour: "peach",
        object: "flame",
        headline: `${event.days} DAY\n[STREAK!]`,
        title: `${event.days} days in a row`,
        detail: "Showing up every day is how pros are made.",
        chip: "On fire",
        cta: "Keep it going",
        spin: false,
      };
    case "quest":
      return {
        bg: "bg-sky",
        colour: "sky",
        object: "target",
        headline: "QUEST\n[DONE!]",
        title: event.label,
        detail: "Daily quest complete.",
        chip: `+${event.xpReward} XP`,
        cta: "Nice!",
        spin: false,
      };
    case "habit-stage":
      return {
        bg: "bg-lav",
        colour: "lav",
        object: "sparkle",
        headline: "HABIT\n[UNLOCKED!]",
        title: event.habitTitle,
        detail: `This habit is now ${event.stage}. Keep it going.`,
        chip: event.xpReward > 0 ? `+${event.xpReward} XP` : "New habit",
        cta: "Nice!",
        spin: false,
      };
  }
}

function buzz(): void {
  try {
    navigator.vibrate?.([60, 40, 90]);
  } catch {
    /* unsupported */
  }
}

export function CelebrationOverlay({ event, onDone }: { event: CelebrationEvent; onDone: () => void }) {
  const t = themeFor(event);
  const titleId = useId();
  const ctaWrap = useRef<HTMLDivElement>(null);
  useThemeColor(t.colour);

  useEffect(() => {
    buzz();
    const id = window.setTimeout(() => ctaWrap.current?.querySelector("button")?.focus(), 700);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={`fixed inset-0 z-[100] flex flex-col items-center overflow-hidden px-gutter pt-[max(2rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-ink ${t.bg}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Confetti />

      <div className="relative z-10 mt-auto flex w-full max-w-md flex-col items-center text-center">
        <motion.div
          className="relative"
          initial={{ y: -420, rotate: -24, scale: 0.8, opacity: 0 }}
          animate={{ y: 0, rotate: 0, scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 160, damping: 11, delay: 0.1 }}
        >
          <Sparkles />
          <motion.div
            animate={t.spin ? { rotateY: [0, 360] } : { rotate: [0, -4, 4, 0] }}
            transition={
              t.spin
                ? { duration: 1.4, delay: 0.8, ease: "easeInOut" }
                : { duration: 2.4, delay: 1, repeat: Infinity, repeatDelay: 1 }
            }
            style={{ transformPerspective: 600 }}
          >
            <GameObject name={t.object} size={210} float />
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-4"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.5 }}
        >
          <BracketHeadline size="poster" highlightTone="paper" className="whitespace-pre-line">
            {t.headline}
          </BracketHeadline>
        </motion.div>

        <motion.div
          className="mt-5 flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
        >
          {t.chip && (
            <span className="rounded-pill bg-ink px-4 py-1.5 text-[13px] font-extrabold text-cream">{t.chip}</span>
          )}
          <h2 id={titleId} className="text-[22px] leading-tight font-extrabold tracking-tight">
            {t.title}
          </h2>
          <p className="max-w-[28ch] text-[15px] font-semibold text-ink/75">{t.detail}</p>
        </motion.div>
      </div>

      <motion.div
        ref={ctaWrap}
        className="relative z-10 mt-auto w-full max-w-md pt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.95 }}
      >
        <Button variant="ink" size="lg" fullWidth onClick={onDone}>
          {t.cta}
        </Button>
      </motion.div>
    </motion.div>
  );
}
