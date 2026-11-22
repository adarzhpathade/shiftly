import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/cn";
import { GameObject, type GameObjectName } from "@/components/ui/GameObject";
import type { Quest, QuestType } from "@/lib/types";
import { SectionHead } from "./SectionHead";

export interface QuestListProps {
  quests: readonly Quest[];
}

const QUEST_ART: Record<QuestType, { object: GameObjectName; tile: string }> = {
  scenario: { object: "target", tile: "bg-peach" },
  habit: { object: "calendar", tile: "bg-sky" },
  stars: { object: "medal", tile: "bg-lav" },
};

export function QuestList({ quests }: QuestListProps) {
  const done = quests.filter((q) => q.completed).length;
  return (
    <section aria-label="Daily quests">
      <SectionHead
        title="Daily [quests]"
        note={quests.length ? `${done} / ${quests.length}` : undefined}
      />
      {quests.length === 0 ? (
        <Card
          tone="paper"
          className="rounded-[18px] text-center text-sm text-ink-soft"
        >
          No quests today
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {quests.map((quest) => {
            const pct = Math.min(
              100,
              Math.round((quest.progress / Math.max(1, quest.target)) * 100),
            );
            const art = QUEST_ART[quest.type];
            return (
              <li
                key={quest.id}
                className="flex items-center gap-3 rounded-[18px] bg-paper p-3"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-10 flex-none place-items-center rounded-xl",
                    art.tile,
                  )}
                >
                  <GameObject name={art.object} size={30} />
                </span>
                <div className="min-w-0 flex-1">
                  <b className="block truncate text-[15px]">{quest.label}</b>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div
                      aria-hidden="true"
                      className="h-2 flex-1 overflow-hidden rounded-pill bg-muted"
                    >
                      <div
                        className={cn(
                          "h-full rounded-pill transition-[width] duration-700 ease-out",
                          quest.completed ? "bg-ink" : "bg-lav-ink",
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <small className="flex-none text-xs text-ink-soft">
                      {quest.progress} / {quest.target}
                    </small>
                  </div>
                  <span className="sr-only">
                    {quest.completed ? "Completed" : "In progress"}
                  </span>
                </div>
                <span
                  className={cn(
                    "flex-none rounded-pill px-2.5 py-1.5 text-[11px] leading-none font-bold",
                    quest.completed ? "bg-lime" : "bg-muted",
                  )}
                >
                  +{quest.xpReward} XP
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
