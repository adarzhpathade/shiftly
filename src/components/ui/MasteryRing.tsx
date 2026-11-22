import type { ReactNode } from "react";
import { cn } from "./cn";

export type RingTone = "lime" | "lav-ink" | "red" | "flame" | "xp-gold" | "sky" | "ink";

const TONE: Record<RingTone, string> = {
  lime: "text-lime",
  "lav-ink": "text-lav-ink",
  red: "text-red",
  flame: "text-flame",
  "xp-gold": "text-xp-gold",
  sky: "text-sky",
  ink: "text-ink",
};

export type MasteryRingProps = {
  /** 0-100. */
  value: number;
  tone?: RingTone;
  size?: number;
  strokeWidth?: number;
  /** Centre content; defaults to the percentage. */
  children?: ReactNode;
  label?: string;
  className?: string;
};

export function MasteryRing({
  value,
  tone = "lav-ink",
  size = 72,
  strokeWidth = 8,
  children,
  label = "Mastery",
  className,
}: MasteryRingProps) {
  const v = Math.min(100, Math.max(0, value));
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v)}
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
        focusable="false"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v / 100)}
          className={cn(TONE[tone], "transition-[stroke-dashoffset] duration-700 ease-out")}
        />
      </svg>
      <span className="absolute text-sm font-extrabold tracking-tight">
        {children ?? `${Math.round(v)}%`}
      </span>
    </div>
  );
}
