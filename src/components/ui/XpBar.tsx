import { cn } from "./cn";

export type XpBarProps = {
  level: number;
  xp: number;
  nextXp: number;
  className?: string;
};

export function XpBar({ level, xp, nextXp, className }: XpBarProps) {
  const pct = nextXp > 0 ? Math.min(100, Math.max(0, (xp / nextXp) * 100)) : 0;
  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between text-[13px] font-bold">
        <span>Level {level}</span>
        <span className="font-semibold text-ink-soft">
          {xp} / {nextXp} XP
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`Level ${level} progress`}
        aria-valuemin={0}
        aria-valuemax={nextXp}
        aria-valuenow={xp}
        className="mt-1.5 h-2.5 overflow-hidden rounded-pill bg-muted"
      >
        <span
          className="block h-full rounded-pill bg-ink transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
