import { cn } from "./cn";
import { SOFT_BG_CLASS, type SoftTone } from "./tones";

export type HabitRowProps = {
  emoji: string;
  tone?: SoftTone;
  title: string;
  /** e.g. "12 day streak". */
  streakText?: string;
  checked?: boolean;
  onToggle?: () => void;
  className?: string;
};

export function HabitRow({
  emoji,
  tone = "peach",
  title,
  streakText,
  checked = false,
  onToggle,
  className,
}: HabitRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[18px] bg-paper p-3",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid size-10 flex-none place-items-center rounded-xl text-xl",
          SOFT_BG_CLASS[tone],
        )}
      >
        {emoji}
      </span>
      <div className="min-w-0 flex-1">
        <b className="block text-[15px]">{title}</b>
        {streakText && (
          <small className="text-xs text-ink-soft">{streakText}</small>
        )}
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={checked}
        aria-label={`${checked ? "Uncheck" : "Check in"}: ${title}`}
        className="-m-1.5 grid size-11 flex-none place-items-center rounded-full transition-transform duration-300 ease-spring active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-lav-ink"
      >
        <span
          className={cn(
            "grid size-[30px] place-items-center rounded-full border-2 border-ink transition-colors duration-300",
            checked && "bg-ink",
          )}
        >
          {checked && (
            <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
              <path
                d="M3 8.5l3 3 7-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-lime"
              />
            </svg>
          )}
        </span>
      </button>
    </div>
  );
}
