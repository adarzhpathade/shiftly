"use client";

import { AnimatePresence, MotionConfig } from "motion/react";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import type { CelebrationEvent } from "@/lib/celebrations";
import { CelebrationOverlay } from "./CelebrationOverlay";

type Celebrate = (event: CelebrationEvent | readonly CelebrationEvent[]) => void;

const CelebrationContext = createContext<Celebrate | null>(null);

/** Queue-based celebrations: events show one at a time, each dismissed with the CTA. */
export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<readonly { id: number; event: CelebrationEvent }[]>([]);
  const counter = useRef(0);

  const celebrate = useCallback<Celebrate>((input) => {
    const events: readonly CelebrationEvent[] = Array.isArray(input)
      ? (input as readonly CelebrationEvent[])
      : [input as CelebrationEvent];
    if (events.length === 0) return;
    const items = events.map((event) => ({ id: counter.current++, event }));
    setQueue((q) => [...q, ...items]);
  }, []);

  const head = queue[0];
  const next = useCallback(() => setQueue((q) => q.slice(1)), []);

  return (
    <CelebrationContext.Provider value={celebrate}>
      {children}
      <MotionConfig reducedMotion="user">
        <AnimatePresence mode="wait">
          {head && <CelebrationOverlay key={head.id} event={head.event} onDone={next} />}
        </AnimatePresence>
      </MotionConfig>
    </CelebrationContext.Provider>
  );
}

/** Typed `celebrate(event | events[])`. A no-op outside the provider. */
export function useCelebrate(): Celebrate {
  return useContext(CelebrationContext) ?? (() => undefined);
}
