"use client";

import { MotionConfig, motion } from "motion/react";
import { useEffect } from "react";
import { AnimatedWordmark, GameObject, Pop, Stagger, useThemeColor } from "@/components/ui";

export type SplashProps = {
  /** Called after the splash plays out, or immediately when the screen is tapped. */
  onDone: () => void;
  /** Milliseconds before auto-advancing. */
  durationMs?: number;
};

/**
 * Cream splash: a trophy drops from above, squashes on landing with a shadow that
 * grows on impact, then floats while the wordmark pops in letter by letter.
 */
export function Splash({ onDone, durationMs = 2800 }: SplashProps) {
  useThemeColor("cream");
  useEffect(() => {
    const t = setTimeout(onDone, durationMs);
    return () => clearTimeout(t);
  }, [onDone, durationMs]);

  return (
    <MotionConfig reducedMotion="user">
      <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-cream px-gutter text-center">
        <button
          type="button"
          onClick={onDone}
          aria-label="Continue to the intro"
          className="absolute inset-0 z-10 cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-lav-ink"
        />
        <div className="flex flex-col items-center gap-5" aria-hidden="true">
          <div className="relative flex flex-col items-center">
            <motion.div
              style={{ transformOrigin: "50% 100%" }}
              initial={{ y: -520, opacity: 0, scaleX: 0.9, scaleY: 1.15 }}
              animate={{
                y: [-520, 0, 0, -26, 0, 0],
                opacity: 1,
                scaleX: [0.9, 1, 1.26, 0.94, 1.03, 1],
                scaleY: [1.15, 1, 0.7, 1.1, 0.97, 1],
              }}
              transition={{
                duration: 1.1,
                times: [0, 0.45, 0.55, 0.7, 0.85, 1],
                ease: ["easeIn", "easeOut", "easeOut", "easeIn", "easeOut"],
                opacity: { duration: 0.12 },
              }}
            >
              <GameObject name="trophy" size={168} float floatDelay={0} />
            </motion.div>
            <div className="absolute top-2 -left-10">
              <Stagger delay={1.0} gap={0.15}>
                <Pop wiggle>
                  <GameObject name="sparkle" size={30} />
                </Pop>
              </Stagger>
            </div>
            <div className="absolute top-12 -right-12">
              <Stagger delay={1.25} gap={0.15}>
                <Pop wiggle delay={0.3}>
                  <GameObject name="sparkle" size={22} />
                </Pop>
              </Stagger>
            </div>
            <motion.div
              className="mt-1 h-3.5 w-36 rounded-[50%] bg-ink/25 blur-[6px]"
              initial={{ scaleX: 0.25, opacity: 0 }}
              animate={{
                scaleX: [0.25, 0.3, 1.25, 0.95, 1],
                opacity: [0, 0.2, 0.9, 0.7, 0.8],
              }}
              transition={{
                duration: 1.1,
                times: [0, 0.4, 0.55, 0.75, 1],
                ease: "easeOut",
              }}
            />
          </div>
          <div className="flex flex-col items-center gap-2">
            <AnimatedWordmark sizeClass="text-[56px]" delay={0.75} />
            <motion.p
              className="text-[15px] font-bold text-ink-soft"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 1.4,
                type: "spring",
                stiffness: 300,
                damping: 22,
              }}
            >
              Small habits, big wins
            </motion.p>
          </div>
        </div>
      </main>
    </MotionConfig>
  );
}
