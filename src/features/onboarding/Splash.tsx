"use client";

import { MotionConfig, motion } from "motion/react";
import { useEffect } from "react";
import { GameObject, Wordmark } from "@/components/ui";

export type SplashProps = {
  /** Called after the splash plays out, or immediately when the screen is tapped. */
  onDone: () => void;
  /** Milliseconds before auto-advancing. */
  durationMs?: number;
};

/** Cream splash: wordmark plus a trophy that drops in with a spring and a squash. */
export function Splash({ onDone, durationMs = 1600 }: SplashProps) {
  useEffect(() => {
    const t = setTimeout(onDone, durationMs);
    return () => clearTimeout(t);
  }, [onDone, durationMs]);

  return (
    <MotionConfig reducedMotion="user">
      <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-cream px-gutter">
        <button
          type="button"
          onClick={onDone}
          aria-label="Continue to the intro"
          className="absolute inset-0 z-10 cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-lav-ink"
        />
        <div className="flex flex-col items-center gap-6" aria-hidden="true">
          <motion.div
            style={{ transformOrigin: "50% 100%" }}
            initial={{ y: -420, opacity: 0, scaleX: 1, scaleY: 1 }}
            animate={{
              y: [-420, 0, 0, 0, 0],
              opacity: 1,
              scaleX: [1, 1, 1.22, 0.96, 1],
              scaleY: [1, 1, 0.74, 1.1, 1],
            }}
            transition={{
              duration: 0.9,
              times: [0, 0.5, 0.62, 0.8, 1],
              ease: "easeOut",
            }}
          >
            <GameObject name="trophy" size={168} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, type: "spring", stiffness: 300, damping: 20 }}
            className="flex flex-col items-center gap-2"
          >
            <Wordmark sizeClass="text-[56px]" />
            <p className="text-[15px] font-bold text-ink-soft">Small habits, big wins</p>
          </motion.div>
        </div>
      </main>
    </MotionConfig>
  );
}
