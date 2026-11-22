"use client";

import { Button } from "@/components/ui";
import { CelebrationProvider, useCelebrate } from "@/features/celebrations";
import type { CelebrationEvent } from "@/lib/celebrations";

const EVENTS: { label: string; event: CelebrationEvent }[] = [
  { label: "Level up", event: { type: "level-up", level: 5 } },
  {
    label: "New badge",
    event: {
      type: "badge",
      badge: { key: "perfect-score", name: "Perfect Score", description: "Earn 3 stars on a scenario.", objectKey: "trophy" },
    },
  },
  { label: "Streak 7", event: { type: "streak", days: 7 } },
  { label: "Streak 30", event: { type: "streak", days: 30 } },
  { label: "Streak 100", event: { type: "streak", days: 100 } },
  { label: "Quest complete", event: { type: "quest", label: "Finish 1 scenario", xpReward: 30 } },
];

function Buttons() {
  const celebrate = useCelebrate();
  return (
    <main className="mx-auto flex max-w-md flex-col gap-2 px-gutter py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Celebrations</h1>
      <p className="mb-3 text-sm text-ink-soft">Dev only. Tap one to trigger it.</p>
      {EVENTS.map(({ label, event }) => (
        <Button key={label} variant="paper" onClick={() => celebrate(event)}>
          {label}
        </Button>
      ))}
      <Button variant="ink" onClick={() => celebrate(EVENTS.map((e) => e.event))}>
        Queue all
      </Button>
    </main>
  );
}

export function CelebrationTester() {
  return (
    <CelebrationProvider>
      <Buttons />
    </CelebrationProvider>
  );
}
