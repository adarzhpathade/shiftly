"use client";

import { motion } from "motion/react";
import { Avatar, GameObject, cn } from "@/components/ui";
import type { LeaderboardEntry } from "@/lib/types";

type Place = 1 | 2 | 3;

const SLOT = {
  1: { pillar: "h-28 bg-lime", avatar: "lg", delay: 0.3 },
  2: { pillar: "h-20 bg-lav", avatar: "md", delay: 0.15 },
  3: { pillar: "h-14 bg-peach", avatar: "md", delay: 0.05 },
} as const;

function Column({
  entry,
  place,
  isMe,
  meRef,
}: {
  entry: LeaderboardEntry;
  place: Place;
  isMe: boolean;
  meRef?: (el: HTMLElement | null) => void;
}) {
  const slot = SLOT[place];
  return (
    <motion.li
      ref={meRef}
      initial={{ opacity: 0, y: 40, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 17, delay: slot.delay }}
      className="flex min-w-0 flex-1 flex-col items-center"
      aria-label={`Rank ${entry.rank}: ${entry.user.name}, ${entry.xp} XP`}
    >
      <div className="relative flex flex-col items-center">
        {place === 1 ? (
          <GameObject name="crown" size={40} float className="z-10 -mb-2" />
        ) : (
          <GameObject name="medal" size={26} className="z-10 -mb-1" />
        )}
        <span className={cn("rounded-full", isMe && "ring-[3px] ring-ink ring-offset-2 ring-offset-cream")}>
          <Avatar name={entry.user.name} avatarKey={entry.user.avatarKey} size={slot.avatar} />
        </span>
      </div>
      <b className="mt-2 w-full truncate text-center text-[13px] leading-tight">
        {isMe ? "You" : (entry.user.name.split(" ")[0] ?? entry.user.name)}
      </b>
      <span className="text-xs font-extrabold text-ink-soft">{entry.xp} XP</span>
      <div
        aria-hidden="true"
        className={cn(
          "mt-2 grid w-full justify-items-center rounded-t-[20px] pt-2 text-[28px] leading-none font-extrabold",
          slot.pillar,
        )}
      >
        {entry.rank}
      </div>
    </motion.li>
  );
}

export interface PodiumProps {
  top: readonly LeaderboardEntry[];
  meId: string;
  meRef: (el: HTMLElement | null) => void;
}

/** Top three, classic 2-1-3 order. Renders only the places that exist. */
export function Podium({ top, meId, meRef }: PodiumProps) {
  // Positional slots (ties share a rank), shown in 2-1-3 order.
  const ordered: (readonly [LeaderboardEntry, Place])[] = [];
  if (top[1]) ordered.push([top[1], 2]);
  if (top[0]) ordered.push([top[0], 1]);
  if (top[2]) ordered.push([top[2], 3]);
  return (
    <ol className="flex items-end gap-2 px-1" aria-label="Top three">
      {ordered.map(([e, place]) => (
        <Column
          key={e.user.id}
          entry={e}
          place={place}
          isMe={e.user.id === meId}
          meRef={e.user.id === meId ? meRef : undefined}
        />
      ))}
    </ol>
  );
}
