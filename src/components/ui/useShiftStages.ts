"use client";

import { useEffect, useRef, useState } from "react";
import { OUT_MS, SHIFT_TIMING, afterCross } from "./shift-loader-timing";

export type ShiftStage = "pre" | "in" | "hold" | "out" | "exit" | "fade";

export type ShiftState = {
  /** False until the show delay has passed, and again once the loader is done. */
  visible: boolean;
  stage: ShiftStage;
  /** Which pair of panels is in play. */
  cycle: number;
  /** How many times the panels have crossed: drives the bracket word. */
  crosses: number;
  /** Random number in [0, 1) drawn when the loader appears (never during render). */
  seed: number;
};

const IDLE: ShiftState = { visible: false, stage: "pre", cycle: 0, crosses: 0, seed: 0 };

export type UseShiftStagesOptions = {
  ready: boolean;
  delayMs?: number;
  /** One still panel and fading words: no sweeping. */
  reduced?: boolean;
  /** Called once when the loader has fully left (or when it never needed to show). */
  onExited?: () => void;
};

/**
 * The ShiftLoader clock.
 * - Nothing shows before `delayMs`; if `ready` arrives first, the loader never appears.
 * - Once shown, it always finishes the current cross before leaving, so there is no cut.
 * - Ready during the cross or the slide-out: the curtain exit (or end of slide-out) follows.
 */
export function useShiftStages({
  ready,
  delayMs = SHIFT_TIMING.showDelayMs,
  reduced = false,
  onExited,
}: UseShiftStagesOptions): ShiftState {
  const [state, setState] = useState<ShiftState>(IDLE);
  const readyRef = useRef(ready);
  const exitedRef = useRef(onExited);
  const startedRef = useRef(false);
  const cancelStartRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    readyRef.current = ready;
    exitedRef.current = onExited;
  });

  useEffect(() => {
    let dead = false;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const after = (ms: number, fn: () => void) => {
      const t = setTimeout(() => {
        timers.delete(t);
        if (!dead) fn();
      }, ms);
      timers.add(t);
    };
    const patch = (p: Partial<ShiftState>) => setState((s) => ({ ...s, ...p }));
    const finish = () => {
      setState((s) => ({ ...s, visible: false }));
      exitedRef.current?.();
    };

    const runCycle = (cycle: number) => {
      setState((s) => ({ ...s, visible: true, stage: "pre", cycle }));
      after(24, () => patch({ stage: "in" }));
      after(SHIFT_TIMING.inMs, () => setState((s) => ({ ...s, stage: "hold", crosses: s.crosses + 1 })));
      after(SHIFT_TIMING.inMs + SHIFT_TIMING.holdMs, () => {
        if (afterCross(readyRef.current) === "exit") {
          patch({ stage: "exit" });
          after(SHIFT_TIMING.exitMs, finish);
        } else {
          patch({ stage: "out" });
          after(OUT_MS, () => {
            if (!readyRef.current) return runCycle(cycle + 1);
            patch({ stage: "fade" });
            after(SHIFT_TIMING.fadeMs, finish);
          });
        }
      });
    };

    const runStill = (cycle: number) => {
      setState((s) => ({ ...s, visible: true, stage: "hold", cycle, crosses: cycle }));
      after(SHIFT_TIMING.cycleMs, () => {
        if (readyRef.current) {
          patch({ stage: "exit" });
          after(260, finish);
        } else runStill(cycle + 1);
      });
    };

    const start = () => {
      startedRef.current = true;
      cancelStartRef.current = null;
      if (readyRef.current) {
        exitedRef.current?.();
        return;
      }
      setState((s) => ({ ...s, seed: Math.random() }));
      if (reduced) runStill(0);
      else runCycle(0);
    };

    startedRef.current = false;
    const startTimer = setTimeout(start, delayMs);
    cancelStartRef.current = () => clearTimeout(startTimer);

    return () => {
      dead = true;
      clearTimeout(startTimer);
      timers.forEach(clearTimeout);
      cancelStartRef.current = null;
    };
  }, [delayMs, reduced]);

  // Ready before the delay: skip the whole show.
  useEffect(() => {
    if (ready && !startedRef.current && cancelStartRef.current) {
      cancelStartRef.current();
      cancelStartRef.current = null;
      exitedRef.current?.();
    }
  }, [ready]);

  return state;
}
