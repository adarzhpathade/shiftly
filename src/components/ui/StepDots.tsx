"use client";

import { MotionConfig, motion } from "motion/react";
import { cn } from "./cn";

export type StepDotsProps = {
  count: number;
  /** Zero-based index of the current step. */
  active: number;
  label?: string;
  className?: string;
};

/** Progress dots: the active one springs wider into a pill. */
export function StepDots({ count, active, label, className }: StepDotsProps) {
  return (
    <MotionConfig reducedMotion="user">
      <div
        role="img"
        aria-label={label ?? `Step ${active + 1} of ${count}`}
        className={cn("flex items-center gap-1.5", className)}
      >
        {Array.from({ length: count }, (_, i) => (
          <motion.span
            key={i}
            aria-hidden="true"
            initial={false}
            animate={{
              width: i === active ? 24 : 8,
              opacity: i === active ? 1 : 0.28,
            }}
            transition={{ type: "spring", stiffness: 420, damping: 24 }}
            className="h-2 rounded-pill bg-ink"
          />
        ))}
      </div>
    </MotionConfig>
  );
}
