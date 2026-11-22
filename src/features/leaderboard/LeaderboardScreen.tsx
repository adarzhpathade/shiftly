"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { BracketHeadline, Card, GameObject, Rise, ThemeColor, cn } from "@/components/ui";
import type { Leaderboard, LeaderboardPeriod, LeaderboardScope } from "@/lib/types";
import { Podium } from "./Podium";
import { RankRow } from "./RankRow";
import { SegmentedControl } from "./SegmentedControl";

export interface LeaderboardScreenProps {
  leaderboard: Leaderboard;
  /** Selected tabs (may run ahead of `leaderboard` while the next one loads). */
  scope: LeaderboardScope;
  period: LeaderboardPeriod;
  /** Formatted countdown such as "2d 4h"; null for all-time. */
  resetsIn: string | null;
  pending?: boolean;
  onChange: (next: { scope: LeaderboardScope; period: LeaderboardPeriod }) => void;
}

const SCOPES = [
  { value: "team", label: "Team" },
  { value: "company", label: "Company" },
] as const;
const PERIODS = [
  { value: "week", label: "This week" },
  { value: "all", label: "All time" },
] as const;

const LIST_VARIANTS = {
  hidden: {},
  show: { transition: { staggerChildren: 0.035, delayChildren: 0.05 } },
} as const;

export function LeaderboardScreen({
  leaderboard,
  scope,
  period,
  resetsIn,
  pending = false,
  onChange,
}: LeaderboardScreenProps) {
  const { entries, me } = leaderboard;
  const top = entries.slice(0, 3);
  const rest = entries.slice(3);

  const [meEl, setMeEl] = useState<HTMLElement | null>(null);
  const [meVisible, setMeVisible] = useState(false);
  const meRef = useCallback((el: HTMLElement | null) => setMeEl(el), []);

  useEffect(() => {
    if (!meEl) return;
    const io = new IntersectionObserver(([e]) => setMeVisible(e?.isIntersecting ?? false), {
      rootMargin: "0px 0px -110px 0px",
    });
    io.observe(meEl);
    return () => {
      io.disconnect();
      setMeVisible(false);
    };
  }, [meEl]);

  const showPinned = entries.length > 0 && (!meEl || !meVisible);
  const key = `${leaderboard.scope}-${leaderboard.period}`;
  const busy = pending || leaderboard.scope !== scope || leaderboard.period !== period;

  return (
    <MotionConfig reducedMotion="user">
      <ThemeColor color="cream" />
      <main className="px-gutter pt-8">
        <p className="text-[13px] font-bold tracking-[0.06em] text-ink-soft uppercase">Leaderboard</p>
        <BracketHeadline size="h1" className="mt-1.5">
          {"Climb the\n[board]"}
        </BracketHeadline>

        <div className="mt-5 flex flex-col gap-2">
          <SegmentedControl
            label="Scope"
            value={scope}
            options={SCOPES}
            onChange={(v) => onChange({ scope: v, period })}
          />
          <SegmentedControl
            label="Period"
            size="sm"
            value={period}
            options={PERIODS}
            onChange={(v) => onChange({ scope, period: v })}
          />
        </div>

        <div className="mt-3 flex min-h-8 items-center gap-2 text-[13px] font-bold text-ink-soft" aria-live="polite">
          {period === "week" ? (
            <>
              <GameObject name="calendar" size={24} />
              <span>{resetsIn ? `Resets in ${resetsIn}` : "Resets every Monday"}</span>
            </>
          ) : (
            <>
              <GameObject name="trophy" size={24} />
              <span>Every XP you ever earned</span>
            </>
          )}
        </div>

        <div className={cn("mt-3 transition-opacity duration-200", busy && "opacity-50")} aria-busy={busy}>
          {entries.length === 0 ? (
            <Rise>
              <Card tone="lav" padding="lg" className="flex flex-col items-center gap-3 text-center">
                <GameObject name="rocket" size={96} float />
                <h2 className="text-[22px] leading-tight font-extrabold tracking-tight">
                  {leaderboard.period === "week" ? "A fresh week" : "Nobody here yet"}
                </h2>
                <p className="text-sm font-medium text-ink/75">
                  {leaderboard.period === "week"
                    ? "No XP yet this week. Finish a scenario or check in a habit and take the lead."
                    : "Earn some XP and you will show up here."}
                </p>
              </Card>
            </Rise>
          ) : (
            <div key={key}>
              <Podium top={top} meId={me.user.id} meRef={meRef} />
              {rest.length > 0 && (
                <motion.ul
                  className="mt-4 flex flex-col gap-2"
                  variants={LIST_VARIANTS}
                  initial="hidden"
                  animate="show"
                >
                  {rest.map((e) => (
                    <RankRow
                      key={e.user.id}
                      entry={e}
                      scope={leaderboard.scope}
                      isMe={e.user.id === me.user.id}
                      rowRef={e.user.id === me.user.id ? meRef : undefined}
                    />
                  ))}
                </motion.ul>
              )}
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {showPinned && (
          <motion.ul
            key="pinned"
            aria-label="Your rank"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 340, damping: 26 }}
            className="fixed inset-x-3.5 bottom-24 z-30 mx-auto max-w-md"
          >
            <RankRow entry={me} scope={leaderboard.scope} isMe pinned />
          </motion.ul>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
