"use client";

import { useState } from "react";
import { Button, ShiftLoader } from "@/components/ui";

export function FullScreenLoaderDemo() {
  const [run, setRun] = useState(0);
  const [ready, setReady] = useState(false);
  return (
    <main className="min-h-dvh bg-cream p-gutter">
      <p className="pt-10 text-center text-lg font-extrabold">The page is ready.</p>
      <ShiftLoader key={run} ready={ready} onExited={() => undefined} />
      <div className="fixed inset-x-0 bottom-4 z-[90] flex justify-center gap-2">
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
    </main>
  );
}
