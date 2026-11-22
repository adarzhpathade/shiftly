import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/cn";
import type { Quest } from "@/lib/types";

export interface QuestListProps {
  quests: readonly Quest[];
}

export function QuestList({ quests }: QuestListProps) {
  return (
    <section aria-labelledby="quests-heading" className="flex flex-col gap-3">
      <h2 id="quests-heading" className="text-lg font-extrabold">
        Daily Quests
      </h2>
      {quests.length === 0 ? (
        <Card tone="paper" className="text-center text-sm text-ink-soft">
          No quests today
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {quests.map((quest) => {
            const pct = Math.min(
              100,
              Math.round((quest.progress / Math.max(1, quest.target)) * 100),
            );
            return (
              <li key={quest.id}>
                <Card
                  tone="paper"
                  padding="sm"
                  className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 px-4 py-3"
                >
                  <span className="text-[15px] font-bold">{quest.label}</span>
                  <span
                    className={cn(
                      "rounded-pill px-2.5 py-1 text-xs font-bold",
                      quest.completed ? "bg-lime" : "bg-cream",
                    )}
                  >
                    +{quest.xpReward} XP
                  </span>
                  <div className="col-span-2 flex items-center gap-3">
                    <div
                      aria-hidden="true"
                      className="h-2 flex-1 overflow-hidden rounded-pill bg-cream"
                    >
                      <div
                        className={cn(
                          "h-full rounded-pill transition-[width] duration-700 ease-out",
                          quest.completed ? "bg-ink" : "bg-lav-ink",
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-ink-soft">
                      {quest.progress} / {quest.target}
                    </span>
                    <span className="sr-only">
                      {quest.completed ? "Completed" : "In progress"}
                    </span>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
