import { cn } from "./cn";
import { GameObject } from "./GameObject";

export type StreakPillProps = {
  count: number;
  className?: string;
};

export function StreakPill({ count, className }: StreakPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill bg-paper py-1 pr-3 pl-1 text-[15px] font-extrabold",
        className,
      )}
    >
      <GameObject name="flame" size={30} />
      <span aria-hidden="true">{count}</span>
      <span className="sr-only">{count} day streak</span>
    </span>
  );
}
