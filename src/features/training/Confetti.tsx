"use client";

import { motion, useReducedMotion } from "motion/react";

const COLORS = ["bg-lime", "bg-lav", "bg-peach", "bg-sky", "bg-paper", "bg-flame"] as const;
const COUNT = 28;

/** Deterministic pseudo-random in [0,1) so server and client markup match. */
function rnd(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** One-shot confetti burst. Decorative, pointer-transparent, off with reduced motion. */
export function Confetti() {
  const reduced = useReducedMotion();
  if (reduced) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden"
    >
      {Array.from({ length: COUNT }, (_, i) => {
        const left = rnd(i, 1) * 100;
        const size = 7 + rnd(i, 2) * 8;
        return (
          <motion.span
            key={i}
            className={`absolute -top-4 block rounded-[3px] ${COLORS[i % COLORS.length]}`}
            style={{ left: `${left}%`, width: size, height: size * 1.6 }}
            initial={{ y: -20, opacity: 1, rotate: 0 }}
            animate={{
              y: 620 + rnd(i, 3) * 200,
              x: (rnd(i, 4) - 0.5) * 140,
              rotate: (rnd(i, 5) - 0.5) * 720,
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: 2 + rnd(i, 6) * 1.4,
              delay: 0.5 + rnd(i, 7) * 0.5,
              ease: "easeOut",
            }}
          />
        );
      })}
    </div>
  );
}
