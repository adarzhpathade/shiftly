"use client";

import {
  MotionConfig,
  motion,
  type HTMLMotionProps,
  type Variants,
} from "motion/react";
import type { ReactNode } from "react";

/**
 * Motion building blocks. Everything animates transform and opacity only, and
 * `MotionConfig reducedMotion="user"` turns movement into plain fades for people
 * who prefer reduced motion. `Rise`, `Pop` and `Drop` take their cue from the
 * nearest `Stagger` parent, so a screen reads as one choreographed entrance.
 */

const SPRING = { type: "spring", stiffness: 320, damping: 24 } as const;
const BOUNCY = { type: "spring", stiffness: 420, damping: 14 } as const;
const DROP = {
  type: "spring",
  stiffness: 170,
  damping: 11,
  mass: 0.9,
} as const;

export type StaggerProps = {
  children: ReactNode;
  className?: string;
  /** Seconds between children. */
  gap?: number;
  /** Seconds before the first child. */
  delay?: number;
};

/** Container that plays its `Rise` / `Pop` / `Drop` children one after another. */
export function Stagger({
  children,
  className,
  gap = 0.08,
  delay = 0.05,
}: StaggerProps) {
  const variants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: gap, delayChildren: delay } },
  };
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        className={className}
        variants={variants}
        initial="hidden"
        animate="show"
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}

type ItemProps = {
  children: ReactNode;
  className?: string;
  /** Extra seconds on top of the stagger. */
  delay?: number;
};

const RISE: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: (d: number) => ({
    opacity: 1,
    y: 0,
    transition: { ...SPRING, delay: d },
  }),
};

/** Fades up into place. */
export function Rise({ children, className, delay = 0 }: ItemProps) {
  return (
    <motion.div className={className} variants={RISE} custom={delay}>
      {children}
    </motion.div>
  );
}

const POP: Variants = {
  hidden: { opacity: 0, scale: 0.3, rotate: -14 },
  show: (d: number) => ({
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { ...BOUNCY, delay: d },
  }),
};

/** Pops in with a little overshoot, then (optionally) wiggles now and then. */
export function Pop({
  children,
  className,
  delay = 0,
  wiggle = false,
}: ItemProps & { wiggle?: boolean }) {
  return (
    <motion.div className={className} variants={POP} custom={delay}>
      {wiggle ? (
        <motion.div
          animate={{ rotate: [0, -7, 6, -3, 0] }}
          transition={{
            duration: 1.1,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 2.2,
            delay: 1.4 + delay,
          }}
        >
          {children}
        </motion.div>
      ) : (
        children
      )}
    </motion.div>
  );
}

const DROP_IN: Variants = {
  hidden: { opacity: 0, y: -240, rotate: -22, scale: 0.9 },
  show: (d: number) => ({
    opacity: 1,
    y: 0,
    rotate: 0,
    scale: 1,
    transition: { ...DROP, delay: d, opacity: { duration: 0.15, delay: d } },
  }),
};

/** Drops in from above with a bouncy spring. */
export function Drop({ children, className, delay = 0 }: ItemProps) {
  return (
    <motion.div className={className} variants={DROP_IN} custom={delay}>
      {children}
    </motion.div>
  );
}

/** Splits `[bracket]` markup into plain words and highlighted words. */
function toWords(text: string): { word: string; bracket: boolean }[] {
  const out: { word: string; bracket: boolean }[] = [];
  for (const part of text.split(/(\[[^\]]+\])/g)) {
    if (!part) continue;
    const bracket = /^\[[^\]]+\]$/.test(part);
    const raw = bracket ? part.slice(1, -1) : part;
    for (const w of raw.split(/(\s+)/)) {
      if (w) out.push({ word: w, bracket });
    }
  }
  return out;
}

export type RiseTextProps = {
  /** Text with optional `[bracket]` words and `\n` line breaks. */
  children: string;
  /** Rise word by word (default) or letter by letter. */
  by?: "words" | "letters";
  /** Classes for bracketed words, e.g. `rounded-md bg-paper px-1.5 text-ink`. */
  bracketClassName?: string;
  /** Seconds before the first piece moves. */
  delay?: number;
  className?: string;
};

const PIECE: Variants = {
  hidden: { opacity: 0, y: "0.55em", rotate: 6 },
  show: (d: number) => ({
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: { type: "spring", stiffness: 380, damping: 17, delay: d },
  }),
};

/**
 * Text whose words or letters rise one by one with a spring. Screen readers get the
 * plain text; the animated copy is hidden from them. It plays on mount.
 */
export function RiseText({
  children,
  by = "words",
  bracketClassName,
  delay = 0,
  className,
}: RiseTextProps) {
  const plain = children.replace(/[[\]]/g, "").replace(/\n/g, " ");
  let n = 0;
  return (
    <MotionConfig reducedMotion="user">
      <motion.span
        className={className}
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: {} }}
      >
        <span className="sr-only">{plain}</span>
        <span aria-hidden="true">
          {children.split("\n").map((line, li) => (
            <span key={li} className="block">
              {toWords(line).map(({ word, bracket }, wi) => {
                if (/^\s+$/.test(word)) return " ";
                const pieces = by === "letters" ? Array.from(word) : [word];
                const body = pieces.map((p, pi) => {
                  const d = delay + n++ * (by === "letters" ? 0.045 : 0.1);
                  return (
                    <motion.span
                      key={pi}
                      className="inline-block will-change-transform"
                      variants={PIECE}
                      custom={d}
                    >
                      {p}
                    </motion.span>
                  );
                });
                return bracket ? (
                  <span key={wi} className={bracketClassName}>
                    {body}
                  </span>
                ) : (
                  <span key={wi}>{body}</span>
                );
              })}
            </span>
          ))}
        </span>
      </motion.span>
    </MotionConfig>
  );
}

export type ShakeTextProps = Omit<
  HTMLMotionProps<"p">,
  "animate" | "initial"
> & {
  children: ReactNode;
};

/** Error text that fades in and shakes gently once. */
export function ShakeText({ children, ...rest }: ShakeTextProps) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.p
        initial={{ opacity: 0, y: -4, x: 0 }}
        animate={{ opacity: 1, y: 0, x: [0, -7, 6, -4, 2, 0] }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        {...rest}
      >
        {children}
      </motion.p>
    </MotionConfig>
  );
}

/** A check mark that draws itself in and pops with a spring. */
export function AnimatedCheck({ className }: { className?: string }) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        className={className ?? "size-4"}
        initial={{ scale: 0, rotate: -40 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 520, damping: 15 }}
      >
        <motion.path
          d="M3 8.5l3 3 7-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.28, delay: 0.05, ease: "easeOut" }}
        />
      </motion.svg>
    </MotionConfig>
  );
}
