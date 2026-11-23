"use client";

import { AnimatePresence, MotionConfig, motion, useReducedMotion, type Variants } from "motion/react";
import { BUDDIES, BUDDY_KEYS, type BuddyKey } from "@/assets/stickers";
import { BracketHeadline } from "./BracketHeadline";
import { GameObject, type GameObjectName } from "./GameObject";
import { Sticker } from "./Sticker";
import { ThemeColor } from "./ThemeColor";
import { cn } from "./cn";
import {
  SHIFT_TIMING,
  SHIFT_WORDS,
  panelPair,
  themeColorFor,
  wordAt,
  type PanelTone,
} from "./shift-loader-timing";
import { useShiftStages } from "./useShiftStages";

export type ShiftLoaderProps = {
  /** Page is ready: the loader finishes the current cross, parts like a curtain and leaves. */
  ready?: boolean;
  /** The user's own buddy rides a panel. Random when omitted. */
  buddy?: BuddyKey;
  /** Bracket words, one per cross. */
  words?: readonly string[];
  /** Nothing shows before this many ms (fast loads never flash). */
  delayMs?: number;
  /** Fill the nearest positioned parent instead of the whole screen (gallery frames). */
  contained?: boolean;
  /** Overrides the user's `prefers-reduced-motion` setting. */
  reducedMotion?: boolean;
  /** Fires once when the loader has left, or straight away when it never showed. */
  onExited?: () => void;
  className?: string;
};

const PANEL_BG: Record<PanelTone, string> = {
  lime: "bg-lime",
  lav: "bg-lav",
  ink: "bg-ink",
};

const OBJECTS: readonly [GameObjectName, GameObjectName][] = [
  ["rocket", "trophy"],
  ["headset", "flame"],
  ["target", "crown"],
];

type Bezier = [number, number, number, number];
const EASE_IN: Bezier = [0.5, 0, 0.9, 0.4];
const EASE_OUT: Bezier = [0.16, 0.84, 0.3, 1];
const EASE_BOTH: Bezier = [0.65, 0, 0.35, 1];
const { inMs, holdMs, exitMs } = SHIFT_TIMING;
const sec = (ms: number) => ms / 1000;
const OUT_S = sec(SHIFT_TIMING.cycleMs - inMs - holdMs);
const SNAP = { duration: 0 };

/** A slab: `dir` 1 comes in from the left (top-left panel), -1 from the right. */
function slabVariants(dir: 1 | -1): Variants {
  const off = `${-100 * dir}%`;
  return {
    pre: { x: off, transition: SNAP },
    in: { x: "0%", transition: { duration: sec(inMs), ease: EASE_OUT } },
    hold: { x: "0%" },
    out: { x: `${100 * dir}%`, transition: { duration: OUT_S, ease: EASE_IN } },
    exit: { x: off, transition: { duration: sec(exitMs), ease: EASE_BOTH } },
  };
}

const SLAB_A = slabVariants(1);
const SLAB_B = slabVariants(-1);

const TUMBLE: Variants = {
  pre: { rotate: -35, scale: 0.9, transition: SNAP },
  in: { rotate: -8, scale: 1, transition: { duration: sec(inMs), ease: EASE_OUT } },
  hold: { rotate: [-8, 80], scale: [1, 1.22, 1], transition: { duration: sec(holdMs), ease: "easeOut" } },
  out: { rotate: 160, transition: { duration: OUT_S, ease: EASE_IN } },
  exit: { rotate: 12, transition: { duration: sec(exitMs), ease: EASE_BOTH } },
};

const WAVE: Variants = {
  pre: { rotate: 0, transition: SNAP },
  in: { rotate: [0, -6, 4], transition: { duration: sec(inMs) } },
  hold: { rotate: [4, -10, 8, -4, 0], transition: { duration: sec(holdMs) } },
  out: { rotate: [0, 6, -4, 0], transition: { duration: OUT_S } },
  exit: { rotate: [0, -16, 14, -12, 8, 0], transition: { duration: sec(exitMs) } },
};

const BACKDROP: Variants = {
  pre: { opacity: 1, transition: { duration: 0.18 } },
  in: { opacity: 1 },
  hold: { opacity: 1 },
  out: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.5, delay: 0.15 } },
  fade: { opacity: 0, transition: { duration: sec(SHIFT_TIMING.fadeMs) } },
};

const PLATE: Variants = {
  pre: { opacity: 1 },
  in: { opacity: 1 },
  hold: { opacity: 1 },
  out: { opacity: 1 },
  exit: { opacity: 0, scale: 0.92, transition: { duration: 0.3 } },
  fade: { opacity: 0, transition: { duration: 0.25 } },
};

const POP = { type: "spring", stiffness: 480, damping: 15 } as const;

function WordTag({ word, pop }: { word: string; pop: boolean }) {
  return (
    <motion.div
      initial={pop ? { scale: 0.55, opacity: 0, rotate: -4 } : { opacity: 0 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      exit={pop ? undefined : { opacity: 0 }}
      transition={pop ? POP : { duration: 0.3 }}
      className="rounded-card bg-paper px-7 py-4"
    >
      <BracketHeadline size="h1" as="p" className="whitespace-nowrap">
        {`[${word}]`}
      </BracketHeadline>
    </motion.div>
  );
}

/**
 * "The Shift Change": the full-screen loader. Lime and lavender (then maroon) slabs slide
 * across each other like shifts handing over, each carrying a soft 3D object; a buddy rides
 * one panel; a [bracket] word in the middle swaps at every cross. When `ready` flips, it
 * finishes the cross, parts like a curtain and leaves, with the page already underneath.
 *
 * Shows nothing for `delayMs` (250), so fast loads never flash. Only transform and opacity
 * animate. With reduced motion: one still panel, the object, and a fading word.
 */
export function ShiftLoader({
  ready = false,
  buddy,
  words = SHIFT_WORDS,
  delayMs,
  contained = false,
  reducedMotion,
  onExited,
  className,
}: ShiftLoaderProps) {
  const prefersReduced = useReducedMotion();
  const reduced = reducedMotion ?? prefersReduced ?? false;
  const { visible, stage, cycle, crosses, seed } = useShiftStages({ ready, delayMs, reduced, onExited });
  if (!visible) return null;

  const randomBuddy = BUDDY_KEYS[Math.floor(seed * BUDDY_KEYS.length)] ?? "buddy-1";
  const buddyDef = BUDDIES[buddy ?? randomBuddy];
  const [toneA, toneB] = panelPair(cycle);
  const [objA, objB] = OBJECTS[cycle % OBJECTS.length]!;
  const word = wordAt(words, reduced ? cycle : crosses);
  const frame = cn(contained ? "absolute" : "fixed", "inset-0 z-[80] overflow-hidden touch-none", className);

  if (reduced) {
    return (
      <MotionConfig reducedMotion="never">
        <ThemeColor color="lav" />
        <motion.div
          role="status"
          aria-busy="true"
          data-shift-loader="reduced"
          className={cn(frame, "grid place-items-center bg-lav")}
          initial={{ opacity: 0 }}
          animate={{ opacity: stage === "exit" ? 0 : 1 }}
          transition={{ duration: 0.25 }}
        >
          <span className="sr-only">Loading</span>
          <div aria-hidden="true" className="flex flex-col items-center gap-5">
            <GameObject name={objA} size={132} />
            <AnimatePresence mode="wait" initial={false}>
              <WordTag key={word} word={word} pop={false} />
            </AnimatePresence>
          </div>
        </motion.div>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="never">
      <ThemeColor key={themeColorFor(cycle)} color={themeColorFor(cycle)} />
      <div role="status" aria-busy="true" data-shift-loader="full" data-stage={stage} className={frame}>
        <span className="sr-only">Loading</span>
        <div aria-hidden="true" className="absolute inset-0">
          <motion.div
            className="absolute inset-0 bg-cream"
            variants={BACKDROP}
            initial={{ opacity: 0 }}
            animate={stage}
          />

          {/* The tilted plane the panels slide along. */}
          <div className="absolute top-0 left-[-100%] h-full w-[300%] -rotate-[16deg]">
            <motion.div
              className={cn("absolute inset-x-0 top-[-14%] h-[66%] rounded-[88px] will-change-transform", PANEL_BG[toneA])}
              variants={SLAB_A}
              initial="pre"
              animate={stage}
            />
            <motion.div
              className={cn("absolute inset-x-0 top-[48%] h-[66%] rounded-[88px] will-change-transform", PANEL_BG[toneB])}
              variants={SLAB_B}
              initial="pre"
              animate={stage}
            />

            {/* Riders move with their slab, stay upright, and sit above both slabs. */}
            <motion.div
              className="absolute inset-x-0 top-[-14%] h-[66%] will-change-transform"
              variants={SLAB_A}
              initial="pre"
              animate={stage}
            >
              <div className="absolute top-1/2 left-1/2 rotate-[16deg]">
                <motion.div variants={TUMBLE} className="-translate-1/2">
                  <GameObject name={objA} size={118} />
                </motion.div>
              </div>
            </motion.div>
            <motion.div
              className="absolute inset-x-0 top-[48%] h-[66%] will-change-transform"
              variants={SLAB_B}
              initial="pre"
              animate={stage}
            >
              <div className="absolute top-1/2 left-1/2 rotate-[16deg]">
                <motion.div variants={TUMBLE} className="-translate-1/2">
                  <GameObject name={objB} size={118} />
                </motion.div>
              </div>
              <div className="absolute top-0 left-[62%] rotate-[16deg]">
                <motion.div variants={WAVE} style={{ originY: 1 }} className="-translate-x-1/2 -translate-y-[88%]">
                  <Sticker pose={buddyDef.pose} accessory={buddyDef.accessory} size={96} />
                </motion.div>
              </div>
            </motion.div>
          </div>

          <div className="absolute inset-0 z-10 grid place-items-center">
            <motion.div variants={PLATE} initial="pre" animate={stage}>
              <WordTag key={word} word={word} pop />
            </motion.div>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
