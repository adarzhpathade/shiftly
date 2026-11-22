"use client";

import { useState } from "react";
import { BracketHeadline, Button, GAME_OBJECT_NAMES, GameObject, cn, type GameObjectName } from "@/components/ui";
import type { Badge } from "@/lib/types";
import { Sheet } from "./Sheet";

function objectFor(key: string): GameObjectName {
  return (GAME_OBJECT_NAMES as readonly string[]).includes(key) ? (key as GameObjectName) : "medal";
}

export function formatEarned(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

/** Earned badges in colour with their 3D object, locked ones greyed. Tap opens the detail sheet. */
export function BadgesGrid({ badges }: { badges: readonly Badge[] }) {
  const [selected, setSelected] = useState<Badge | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <ul className="grid grid-cols-3 gap-2">
        {badges.map((badge) => {
          const earned = badge.earnedAt !== null;
          return (
            <li key={badge.key}>
              <button
                type="button"
                onClick={() => {
                  setSelected(badge);
                  setOpen(true);
                }}
                aria-label={`${badge.name}, ${earned ? "earned" : "locked"}`}
                className={cn(
                  "flex h-full w-full flex-col items-center gap-1 rounded-[18px] p-2.5 pb-3 text-center transition-transform active:scale-95",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink",
                  earned ? "bg-lav" : "bg-paper",
                )}
              >
                <span className={cn("relative grid size-14 place-items-center", !earned && "opacity-35 grayscale")}>
                  <GameObject name={objectFor(badge.objectKey)} size={52} />
                </span>
                <span className={cn("text-[12px] leading-tight font-extrabold", !earned && "text-ink-soft")}>
                  {badge.name}
                </span>
                {!earned && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-ink-soft">
                    <svg viewBox="0 0 12 12" width={9} height={9} fill="currentColor" aria-hidden="true">
                      <path d="M3 5V4a3 3 0 0 1 6 0v1h.5A1.5 1.5 0 0 1 11 6.5v4A1.5 1.5 0 0 1 9.5 12h-7A1.5 1.5 0 0 1 1 10.5v-4A1.5 1.5 0 0 1 2.5 5zm1.5 0h3V4a1.5 1.5 0 0 0-3 0z" />
                    </svg>
                    Locked
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <Sheet open={open} onClose={() => setOpen(false)} title={selected?.name ?? "Badge"}>
        {selected && (
          <div className="flex flex-col items-center text-center">
            <span
              className={cn(
                "grid size-32 place-items-center rounded-full",
                selected.earnedAt ? "bg-lav" : "bg-paper",
              )}
            >
              <span className={cn(!selected.earnedAt && "opacity-35 grayscale")}>
                <GameObject name={objectFor(selected.objectKey)} size={96} float={!!selected.earnedAt} />
              </span>
            </span>
            <BracketHeadline size="h2" className="mt-4">
              {selected.name}
            </BracketHeadline>
            <p className="mt-2 text-[15px] font-semibold text-ink-soft">
              <span className="block text-[11px] font-extrabold tracking-[0.06em] text-ink uppercase">How to earn</span>
              {selected.description}
            </p>
            <span
              className={cn(
                "mt-4 rounded-pill px-4 py-1.5 text-[13px] font-extrabold",
                selected.earnedAt ? "bg-lime text-ink" : "bg-muted text-ink-soft",
              )}
            >
              {selected.earnedAt ? `Earned ${formatEarned(selected.earnedAt)}` : "Not earned yet"}
            </span>
            <Button variant="ink" size="lg" fullWidth className="mt-6" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        )}
      </Sheet>
    </>
  );
}
