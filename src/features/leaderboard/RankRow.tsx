"use client";

import { motion } from "motion/react";
import { Avatar, cn } from "@/components/ui";
import type { LeaderboardEntry, LeaderboardScope } from "@/lib/types";
import { RankChange } from "./RankChange";

export interface RankRowProps {
  entry: LeaderboardEntry;
  scope: LeaderboardScope;
  isMe: boolean;
  /** Pinned copy: no list entrance, lifted look. */
  pinned?: boolean;
  rowRef?: (el: HTMLElement | null) => void;
}

const ROW_VARIANTS = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 320, damping: 24 } },
} as const;

export function RankRow({ entry, scope, isMe, pinned = false, rowRef }: RankRowProps) {
  const sub = scope === "company" ? entry.user.teamName : `Level ${entry.user.level}`;
  return (
    <motion.li
      ref={rowRef}
      variants={pinned ? undefined : ROW_VARIANTS}
      aria-current={isMe ? "true" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-[18px] p-2.5 pr-3",
        isMe ? "bg-lime ring-2 ring-ink" : "bg-paper",
        pinned && "shadow-lg",
      )}
    >
      <span className="w-7 flex-none text-center text-[17px] font-extrabold tabular-nums">{entry.rank}</span>
      <Avatar name={entry.user.name} avatarKey={entry.user.avatarKey} size="md" className="flex-none" />
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-1.5">
          <b className="min-w-0 truncate text-[15px]">{entry.user.name}</b>
          {isMe && (
            <span className="flex-none rounded-pill bg-ink px-2 py-0.5 text-[10px] font-extrabold text-cream">
              YOU
            </span>
          )}
        </span>
        <small className={cn("block truncate text-xs font-semibold", isMe ? "text-ink/70" : "text-ink-soft")}>
          {sub}
        </small>
      </span>
      <span className="flex-none text-right text-[14px] leading-none font-extrabold tabular-nums">
        {entry.xp}
        <small className="ml-0.5 text-[10px] font-bold opacity-60">XP</small>
      </span>
      <RankChange change={entry.rankChange} isNew={entry.isNew} className="flex-none" />
    </motion.li>
  );
}
