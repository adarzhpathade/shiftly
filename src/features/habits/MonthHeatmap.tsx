"use client";

import { useMemo, useState } from "react";
import { cn } from "@/components/ui";
import { isoWeekday } from "@/lib/gamification";
import { DAY_LETTERS } from "./tones";

export interface MonthHeatmapProps {
  /** Oldest first; the last entry is today. */
  days: readonly { readonly date: string; readonly done: boolean }[];
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

const pad = (n: number) => String(n).padStart(2, "0");

function Chevron({ dir }: { dir: "l" | "r" }) {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d={dir === "l" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}

/** Month calendar of check-ins. Browse back through the months the data covers. */
export function MonthHeatmap({ days }: MonthHeatmapProps) {
  const first = days[0]?.date;
  const last = days[days.length - 1]?.date;
  const [offset, setOffset] = useState(0);

  const byDate = useMemo(() => new Map(days.map((d) => [d.date, d.done])), [days]);

  if (!first || !last) return null;

  const endY = Number(last.slice(0, 4));
  const endM = Number(last.slice(5, 7)) - 1;
  const startIdx = Number(first.slice(0, 4)) * 12 + Number(first.slice(5, 7)) - 1;
  const viewIdx = endY * 12 + endM - offset;
  const year = Math.floor(viewIdx / 12);
  const month = viewIdx % 12;
  const canPrev = viewIdx > startIdx;
  const canNext = offset > 0;

  const monthStart = `${year}-${pad(month + 1)}-01`;
  const lead = isoWeekday(monthStart) - 1;
  const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: count }, (_, i) => `${year}-${pad(month + 1)}-${pad(i + 1)}`),
  ];

  const doneInMonth = cells.filter((c) => c && byDate.get(c)).length;

  const navBtn =
    "grid size-11 place-items-center rounded-full bg-cream transition-transform active:scale-90 disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink";

  return (
    <section aria-label="Check-in calendar" className="rounded-card bg-paper p-4">
      <div className="flex items-center justify-between">
        <button type="button" className={navBtn} aria-label="Previous month" disabled={!canPrev} onClick={() => setOffset((o) => o + 1)}>
          <Chevron dir="l" />
        </button>
        <div className="text-center">
          <h2 className="text-[17px] leading-tight font-extrabold tracking-tight">
            {MONTHS[month]} {year}
          </h2>
          <p className="text-xs font-semibold text-ink-soft">{doneInMonth} check-ins</p>
        </div>
        <button type="button" className={navBtn} aria-label="Next month" disabled={!canNext} onClick={() => setOffset((o) => o - 1)}>
          <Chevron dir="r" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1.5 text-center" role="grid" aria-label={`${MONTHS[month]} ${year}`}>
        {DAY_LETTERS.map((l, i) => (
          <span key={i} role="columnheader" className="text-[11px] font-bold text-ink-soft">
            {l}
          </span>
        ))}
        {cells.map((date, i) => {
          if (!date) return <span key={`b${i}`} role="gridcell" aria-hidden="true" />;
          const known = byDate.has(date);
          const done = byDate.get(date) === true;
          const isToday = date === last;
          return (
            <span
              key={date}
              role="gridcell"
              data-done={done || undefined}
              aria-label={`${date}${done ? ", done" : known ? ", missed" : ""}`}
              className={cn(
                "grid aspect-square place-items-center rounded-[10px] text-[12px] font-bold",
                done ? "bg-lime text-ink" : known ? "bg-cream text-ink-soft" : "text-ink-soft/40",
                isToday && "ring-2 ring-ink",
              )}
            >
              {Number(date.slice(8))}
            </span>
          );
        })}
      </div>
    </section>
  );
}
