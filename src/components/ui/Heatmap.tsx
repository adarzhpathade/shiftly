import { activeDays, gridLayout, heatLevel, type HeatCell } from "./heatmap-layout";
import { cn } from "./cn";

export type HeatmapProps = {
  cells: readonly HeatCell[];
  /** `row`: the last `days` cells as one thin strip (cards). `grid`: weeks as columns (detail page). */
  variant?: "row" | "grid";
  /** Cells shown in the `row` variant. */
  days?: number;
  className?: string;
};

const LEVEL = [
  "bg-muted",
  "bg-lav",
  "bg-lav-ink/75",
  "bg-lav-ink",
] as const;

const WEEKDAY_LABELS = ["M", "", "W", "", "F", "", "S"] as const;

/**
 * Habit heatmap. Cells run from muted (nothing) through lavender to deep lavender (3+ times).
 * It is an image for assistive tech with a one-line summary; the last cell is outlined as today.
 */
export function Heatmap({ cells, variant = "row", days = 14, className }: HeatmapProps) {
  const shown = variant === "row" ? cells.slice(-days) : cells;
  const active = activeDays(shown);
  const summary = `Active on ${active} of the last ${shown.length} days`;

  if (variant === "row") {
    return (
      <div role="img" aria-label={summary} className={cn("flex gap-[3px]", className)}>
        {shown.map((c, i) => (
          <span
            key={c.date}
            aria-hidden="true"
            className={cn(
              "h-3 min-w-0 flex-1 rounded-[4px]",
              LEVEL[heatLevel(c.count)],
              i === shown.length - 1 && "outline-2 outline-offset-1 outline-ink/60",
            )}
          />
        ))}
      </div>
    );
  }

  const { slots, columns } = gridLayout(shown);
  const last = shown[shown.length - 1]?.date;
  return (
    <div role="img" aria-label={summary} className={cn("flex gap-2", className)}>
      <div
        aria-hidden="true"
        className="grid grid-rows-7 gap-1 pr-0.5 text-[10px] leading-none font-bold text-ink-soft"
      >
        {WEEKDAY_LABELS.map((l, i) => (
          <span key={i} className="grid place-items-center">
            {l}
          </span>
        ))}
      </div>
      <div
        aria-hidden="true"
        className="grid flex-1 grid-flow-col grid-rows-7 gap-1"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {slots.map((c, i) =>
          c ? (
            <span
              key={c.date}
              title={`${c.date}: ${c.count}`}
              className={cn(
                "aspect-square rounded-[5px]",
                LEVEL[heatLevel(c.count)],
                c.date === last && "outline-2 outline-offset-1 outline-ink/60",
              )}
            />
          ) : (
            <span key={`blank-${i}`} className="aspect-square" />
          ),
        )}
      </div>
    </div>
  );
}
