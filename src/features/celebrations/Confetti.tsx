"use client";

import { motion } from "motion/react";

const COLOURS = ["bg-lime", "bg-lav", "bg-peach", "bg-sky", "bg-xp-gold", "bg-red", "bg-paper"] as const;
const COUNT = 34;

/** Deterministic pseudo-random in [0,1) so server and client render the same. */
function rnd(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Confetti rain from the top. Transform/opacity only; hidden from assistive tech. */
export function Confetti() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: COUNT }, (_, i) => {
        const left = rnd(i, 1) * 100;
        const size = 7 + rnd(i, 2) * 9;
        const round = rnd(i, 3) > 0.6;
        const delay = rnd(i, 4) * 0.9;
        const dur = 2.4 + rnd(i, 5) * 1.8;
        const drift = (rnd(i, 6) - 0.5) * 120;
        const spin = (rnd(i, 7) - 0.5) * 900;
        return (
          <motion.span
            key={i}
            className={`absolute -top-6 block ${COLOURS[i % COLOURS.length]} ${round ? "rounded-full" : "rounded-[3px]"}`}
            style={{ left: `${left}%`, width: size, height: round ? size : size * 1.7 }}
            initial={{ y: -40, x: 0, rotate: 0, opacity: 1 }}
            animate={{ y: 900, x: drift, rotate: spin, opacity: [1, 1, 0.9, 0] }}
            transition={{ duration: dur, delay, ease: "easeIn" }}
          />
        );
      })}
    </div>
  );
}

const SPARKS = [
  { x: "-8%", y: "6%", s: 22, d: 0.5 },
  { x: "88%", y: "0%", s: 28, d: 0.7 },
  { x: "96%", y: "62%", s: 18, d: 0.9 },
  { x: "-14%", y: "66%", s: 24, d: 1.0 },
  { x: "44%", y: "-18%", s: 16, d: 0.6 },
] as const;

/** Four-point sparkles twinkling around the hero object. */
export function Sparkles() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {SPARKS.map((p, i) => (
        <motion.svg
          key={i}
          viewBox="0 0 24 24"
          width={p.s}
          height={p.s}
          className="absolute fill-ink"
          style={{ left: p.x, top: p.y }}
          initial={{ scale: 0, rotate: -30, opacity: 0 }}
          animate={{ scale: [0, 1.2, 0.8, 1.1, 0], rotate: [-30, 0, 20], opacity: [0, 1, 1, 1, 0] }}
          transition={{ duration: 2.2, delay: p.d, repeat: Infinity, repeatDelay: 0.6 }}
        >
          <path d="M12 0c1 7 5 11 12 12-7 1-11 5-12 12-1-7-5-11-12-12 7-1 11-5 12-12z" />
        </motion.svg>
      ))}
    </div>
  );
}
