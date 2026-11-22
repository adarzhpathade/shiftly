"use client";

import { useCallback, useState } from "react";
import { IntroStory } from "./IntroStory";
import { Splash } from "./Splash";

export type WelcomeFlowProps = {
  /** Called when the intro is finished or skipped. */
  onFinish: () => void | Promise<void>;
};

/** Splash, then the three intro scenes. */
export function WelcomeFlow({ onFinish }: WelcomeFlowProps) {
  const [phase, setPhase] = useState<"splash" | "intro">("splash");
  const [pending, setPending] = useState(false);
  const toIntro = useCallback(() => setPhase("intro"), []);

  async function finish() {
    if (pending) return;
    setPending(true);
    try {
      await onFinish();
    } finally {
      setPending(false);
    }
  }

  return phase === "splash" ? (
    <Splash onDone={toIntro} />
  ) : (
    <IntroStory onFinish={finish} pending={pending} />
  );
}
