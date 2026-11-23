import { GameObject } from "./GameObject";
import { cn } from "./cn";

export type StrengthMeterProps = {
  /** 0 = empty, 1 = too short, 2 = okay, 3 = strong. */
  level: 0 | 1 | 2 | 3;
  /** Friendly line under the bar, announced politely when it changes. */
  text: string;
  className?: string;
};

const FILL = ["bg-muted", "bg-red", "bg-peach", "bg-lime"] as const;
/** Fill share per level, as a CSS percentage. */
const PERCENT = [0, 34, 67, 100] as const;

/**
 * Password strength as a bar that fills up with a little flame riding its tip. The flame
 * grows with the level. The text under it is the readable version (`aria-live`).
 */
export function StrengthMeter({ level, text, className }: StrengthMeterProps) {
  const pct = Math.max(PERCENT[level], 3);
  return (
    <div className={className}>
      <div
        role="meter"
        aria-label="Password strength"
        aria-valuemin={0}
        aria-valuemax={3}
        aria-valuenow={level}
        aria-valuetext={text}
        className="relative mt-7 h-2.5 rounded-pill bg-muted"
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-y-0 left-0 rounded-pill transition-[width,background-color] duration-500 ease-out",
            FILL[level],
          )}
          style={{ width: `${pct}%` }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[-3px] transition-[left,opacity,transform] duration-500 ease-spring"
          style={{
            left: `min(${pct}%, calc(100% - 12px))`,
            opacity: level === 0 ? 0.35 : 1,
            transform: `translateX(-50%) scale(${0.6 + level * 0.15})`,
            transformOrigin: "50% 100%",
          }}
        >
          <GameObject name="flame" size={30} float={level > 0} />
        </span>
      </div>
      <p className="mt-1.5 text-[13px] font-semibold text-ink-soft" aria-live="polite">
        {text}
      </p>
    </div>
  );
}
