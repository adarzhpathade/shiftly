"use client";

import { MotionConfig, motion } from "motion/react";
import { cn } from "./cn";

export type MoodMeterProps = {
  /** 0 (furious) to 100 (delighted). */
  value: number;
  label?: string;
  className?: string;
};

function face(v: number): string {
  if (v < 34) return "😡";
  if (v < 67) return "😐";
  return "🙂";
}

function barTone(v: number): string {
  if (v < 34) return "bg-red";
  if (v < 67) return "bg-xp-gold";
  return "bg-lime";
}

/** Boss "health bar": the customer's mood. Animates when the value changes. */
export function MoodMeter({
  value,
  label = "Customer mood",
  className,
}: MoodMeterProps) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <MotionConfig reducedMotion="user">
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(v)}
        className={cn(
          "flex items-center gap-3 rounded-pill bg-paper py-2 pr-4 pl-3",
          className,
        )}
      >
        <motion.span
          key={face(v)}
          aria-hidden="true"
          className="text-[28px] leading-none"
          initial={{ scale: 0.5, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 16 }}
        >
          {face(v)}
        </motion.span>
        <div className="flex-1">
          <div className="flex justify-between text-xs font-bold">
            <span>{label}</span>
            <span className="font-semibold text-ink-soft">{Math.round(v)}%</span>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-pill bg-muted">
            <motion.div
              className={cn("h-full rounded-pill", barTone(v))}
              initial={false}
              animate={{ width: `${v}%` }}
              transition={{ type: "spring", stiffness: 140, damping: 20 }}
            />
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
