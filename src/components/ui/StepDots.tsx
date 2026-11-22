import { cn } from "./cn";

export type StepDotsProps = {
  count: number;
  /** Zero-based index of the current step. */
  active: number;
  label?: string;
  className?: string;
};

/** Progress dots: the active one stretches into a pill. */
export function StepDots({ count, active, label, className }: StepDotsProps) {
  return (
    <div
      role="img"
      aria-label={label ?? `Step ${active + 1} of ${count}`}
      className={cn("flex items-center gap-1.5", className)}
    >
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cn(
            "h-2 rounded-pill transition-all duration-300 ease-spring",
            i === active ? "w-6 bg-ink" : "w-2 bg-ink/25",
          )}
        />
      ))}
    </div>
  );
}
