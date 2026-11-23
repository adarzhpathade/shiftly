"use client";

import { useState } from "react";
import {
  BUDDY_KEYS,
  Button,
  ContextLoader,
  Shimmer,
  ShiftLoader,
  TypingBubble,
  ChatBubble,
} from "@/components/ui";
import { PhoneFrame } from "./phone-frame";

const FRAME = "h-[640px]";

/** Interactive demos for the loaders: replay the sweep, flip "page ready", toggle loading. */
export function LoadersDemo() {
  const [run, setRun] = useState(0);
  const [ready, setReady] = useState(false);
  const [runReduced, setRunReduced] = useState(0);
  const [busy, setBusy] = useState(true);
  const buddy = BUDDY_KEYS[run % BUDDY_KEYS.length];

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-start justify-center gap-7">
        <div>
          <PhoneFrame label="ShiftLoader (full motion)" className={FRAME} screenClassName="!p-0">
            <div className="relative h-[620px]">
              <div className="p-4 text-sm font-semibold text-ink-soft">The page underneath.</div>
              <ShiftLoader
                key={run}
                contained
                ready={ready}
                buddy={buddy}
                reducedMotion={false}
                onExited={() => undefined}
              />
            </div>
          </PhoneFrame>
          <div className="mt-3 flex justify-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                setReady(false);
                setRun((n) => n + 1);
              }}
            >
              Replay
            </Button>
            <Button size="sm" variant="lime" onClick={() => setReady(true)}>
              Page ready
            </Button>
          </div>
          <p className="mt-2 text-center text-xs font-semibold text-ink-soft">
            Shows after 250 ms. Page ready finishes the cross, then the curtain parts.
          </p>
        </div>

        <div>
          <PhoneFrame label="ShiftLoader (reduced motion)" className={FRAME} screenClassName="!p-0">
            <div className="relative h-[620px]">
              <ShiftLoader key={runReduced} contained reducedMotion delayMs={0} />
            </div>
          </PhoneFrame>
          <div className="mt-3 flex justify-center">
            <Button size="sm" onClick={() => setRunReduced((n) => n + 1)}>
              Replay
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-center gap-7">
        <PhoneFrame label="Button loading">
          <div className="flex flex-col gap-3">
            <Button variant="ink" size="lg" fullWidth loading={busy}>
              Log in
            </Button>
            <Button variant="lime" size="md" loading={busy}>
              Start scenario
            </Button>
            <Button variant="paper" size="sm" loading={busy}>
              Save
            </Button>
            <Button size="sm" variant="lime" onClick={() => setBusy((b) => !b)}>
              {busy ? "Stop loading" : "Start loading"}
            </Button>
          </div>
        </PhoneFrame>

        <PhoneFrame label="Shimmer skeleton">
          <div className="flex flex-col gap-3">
            <Shimmer tone="lime" peek="wave" className="h-28 rounded-card" />
            <Shimmer tone="lav" className="h-16 rounded-card" />
            <Shimmer tone="peach" className="h-16 rounded-card" />
            <Shimmer tone="sky" className="h-10 w-2/3 rounded-pill" />
            <Shimmer tone="paper" className="h-10 rounded-pill" />
          </div>
        </PhoneFrame>

        <PhoneFrame label="Typing bubble + context loaders" screenClassName="flex flex-col gap-4">
          <ChatBubble>Hello? Is anyone there?</ChatBubble>
          <TypingBubble />
          <ContextLoader variant="scene" />
          <ContextLoader variant="call" />
        </PhoneFrame>
      </div>
    </div>
  );
}
