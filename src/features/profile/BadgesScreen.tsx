"use client";

import { MotionConfig } from "motion/react";
import Link from "next/link";
import { BracketHeadline, Rise, ThemeColor } from "@/components/ui";
import type { Badge } from "@/lib/types";
import { BadgesGrid } from "./BadgesGrid";

export function BadgesScreen({ badges }: { badges: readonly Badge[] }) {
  const earned = badges.filter((b) => b.earnedAt !== null).length;
  const sorted = [...badges].sort((a, b) => Number(b.earnedAt !== null) - Number(a.earnedAt !== null));
  return (
    <MotionConfig reducedMotion="user">
      <ThemeColor color="cream" />
      <main className="px-gutter pt-6">
        <Link
          href="/profile"
          className="inline-flex min-h-11 items-center gap-1 text-[14px] font-extrabold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink"
        >
          <span aria-hidden="true">&larr;</span> Profile
        </Link>
        <Rise>
          <p className="mt-2 text-[13px] font-bold tracking-[0.06em] text-ink-soft uppercase">
            {earned} of {badges.length} earned
          </p>
          <BracketHeadline size="h1" className="mt-1.5">
            {"All your\n[badges]"}
          </BracketHeadline>
        </Rise>
        <div className="mt-5">
          <BadgesGrid badges={sorted} />
        </div>
      </main>
    </MotionConfig>
  );
}
