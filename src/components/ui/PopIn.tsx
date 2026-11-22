"use client";

import { MotionConfig, motion } from "motion/react";
import type { ReactNode } from "react";

export type PopInProps = {
  children: ReactNode;
  /** Seconds before the pop starts. */
  delay?: number;
  className?: string;
};

/** Spring pop-in for celebration moments. Respects prefers-reduced-motion. */
export function PopIn({ children, delay = 0, className }: PopInProps) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        className={className}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 18, delay }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
