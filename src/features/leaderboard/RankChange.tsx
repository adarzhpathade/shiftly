import { cn } from "@/components/ui";

/** Up / down / same marker. The contract has no "new" flag, so 0 reads as "no change". */
export function RankChange({ change, className }: { change: number; className?: string }) {
  if (change === 0) {
    return (
      <span className={cn("inline-flex w-9 justify-center text-xs font-extrabold text-ink-soft", className)}>
        <span aria-hidden="true">–</span>
        <span className="sr-only">No change</span>
      </span>
    );
  }
  const up = change > 0;
  return (
    <span
      className={cn(
        "inline-flex w-9 items-center justify-center gap-0.5 rounded-pill py-0.5 text-[11px] font-extrabold",
        up ? "bg-lime text-ink" : "bg-red/12 text-red",
        className,
      )}
    >
      <svg viewBox="0 0 10 10" width={8} height={8} aria-hidden="true" fill="currentColor">
        {up ? <path d="M5 1l4 7H1z" /> : <path d="M5 9L1 2h8z" />}
      </svg>
      <span aria-hidden="true">{Math.abs(change)}</span>
      <span className="sr-only">{up ? `Up ${change}` : `Down ${Math.abs(change)}`}</span>
    </span>
  );
}
