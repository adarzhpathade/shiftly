"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { BuddyKey } from "@/assets/stickers";
import { ShiftLoader } from "./ShiftLoader";
import { SHIFT_TIMING } from "./shift-loader-timing";

/**
 * Route-level use of ShiftLoader. A route's `loading.tsx` (or Suspense fallback) is replaced
 * the instant its page is ready, so it cannot play an exit animation itself. Instead:
 *
 *   - `<ShiftLoaderHost />` lives once in a layout that stays mounted (it never unmounts
 *     during a navigation) and owns the visible loader;
 *   - `<ShiftLoading />` is rendered by the fallback and only says "a wait is in progress".
 *     When the fallback goes away (page ready), the host finishes the cross and exits.
 */

type Request = { id: number; delayMs: number; buddy?: BuddyKey };

let seq = 0;
let active = 0;
let current: Request | null = null;
let enteredApp = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function acquire(req: Omit<Request, "id">) {
  active += 1;
  if (!current) {
    current = { id: ++seq, ...req };
    emit();
  }
}

function release() {
  active = Math.max(0, active - 1);
  if (active === 0 && current) {
    current = null;
    emit();
  }
}

export type ShiftLoadingProps = {
  /** Wait before the sweep shows. Default 250 ms. */
  delayMs?: number;
  /**
   * Full sweep on the first load of the app (default 250 ms), but only after `slowDelayMs`
   * on later loads, so tab switches stay on their quick skeletons unless something is slow.
   */
  firstEntryOnly?: boolean;
  slowDelayMs?: number;
  buddy?: BuddyKey;
};

/** Render inside a loading boundary. Draws nothing itself; the host shows the loader. */
export function ShiftLoading({
  delayMs = SHIFT_TIMING.showDelayMs,
  firstEntryOnly = false,
  slowDelayMs = 1200,
  buddy,
}: ShiftLoadingProps) {
  // Decided once per mount: is this the first load of the app in this page session?
  const [delay] = useState(() => (firstEntryOnly && enteredApp ? slowDelayMs : delayMs));
  useEffect(() => {
    if (firstEntryOnly) enteredApp = true;
    acquire({ delayMs: delay, buddy });
    return release;
  }, [delay, firstEntryOnly, buddy]);
  return null;
}

const getSnapshot = () => current;
const getServerSnapshot = () => null;

/** Mount once in a layout that persists across navigations. */
export function ShiftLoaderHost({ buddy }: { buddy?: BuddyKey }) {
  const req = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [session, setSession] = useState<Request | null>(null);

  // A wait began and no loader is up yet: adopt it (state derived during render).
  if (req && !session) setSession(req);

  if (!session) return null;
  return (
    <ShiftLoader
      key={session.id}
      ready={!req}
      delayMs={session.delayMs}
      buddy={session.buddy ?? buddy}
      onExited={() => setSession(null)}
    />
  );
}
