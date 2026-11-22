"use client";

import { MotionConfig, motion } from "motion/react";
import { cn } from "./cn";

export type AnimatedWordmarkProps = {
  className?: string;
  sizeClass?: string;
  /** Seconds before the first letter pops. */
  delay?: number;
};

const LETTERS = Array.from("shiftly");

/** The wordmark with each letter popping in, then the star spinning into place. */
export function AnimatedWordmark({
  className,
  sizeClass = "text-[26px]",
  delay = 0,
}: AnimatedWordmarkProps) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.span
        role="img"
        aria-label="shiftly"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.06, delayChildren: delay } },
        }}
        className={cn(
          "inline-flex items-center gap-0.5 font-extrabold tracking-[-0.04em]",
          sizeClass,
          className,
        )}
      >
        {LETTERS.map((ch, i) => (
          <motion.span
            key={i}
            aria-hidden="true"
            className="inline-block"
            variants={{
              hidden: { opacity: 0, y: "0.7em", scale: 0.5, rotate: -12 },
              show: {
                opacity: 1,
                y: 0,
                scale: 1,
                rotate: 0,
                transition: { type: "spring", stiffness: 480, damping: 13 },
              },
            }}
          >
            {ch}
          </motion.span>
        ))}
        <motion.svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="mb-[0.4em] size-[0.7em] fill-ink"
          variants={{
            hidden: { opacity: 0, scale: 0, rotate: -180 },
            show: {
              opacity: 1,
              scale: 1,
              rotate: 0,
              transition: { type: "spring", stiffness: 260, damping: 12 },
            },
          }}
        >
          <path d="M12 1l2.2 6.2L20.5 5l-3.7 5.4L23 12l-6.2 1.6 3.7 5.4-6.3-2.2L12 23l-2.2-6.2L3.5 19l3.7-5.4L1 12l6.2-1.6L3.5 5l6.3 2.2z" />
        </motion.svg>
      </motion.span>
    </MotionConfig>
  );
}
