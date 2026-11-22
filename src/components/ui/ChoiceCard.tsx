import type { ReactNode } from "react";
import { cn } from "./cn";

export type ChoiceState = "idle" | "selected" | "best" | "okay" | "poor";

export type ChoiceCardProps = {
  /** Key letter, e.g. "A". */
  choiceKey: string;
  children: ReactNode;
  state?: ChoiceState;
  onSelect?: () => void;
  /** Revealed feedback title (best/okay/poor only), e.g. "Best answer · +30 XP". */
  feedbackTitle?: string;
  /** Revealed feedback body (best/okay/poor only). */
  feedback?: ReactNode;
  /** Slot inside the feedback box, e.g. a peeking Sticker. */
  feedbackAside?: ReactNode;
  className?: string;
};

const CARD: Record<ChoiceState, string> = {
  idle: "bg-paper",
  selected: "bg-paper ring-2 ring-ink",
  best: "bg-lime",
  okay: "bg-peach",
  poor: "bg-muted",
};

const KEY: Record<ChoiceState, string> = {
  idle: "bg-muted text-ink",
  selected: "bg-ink text-cream",
  best: "bg-ink text-lime",
  okay: "bg-ink text-peach",
  poor: "bg-red text-paper",
};

export function ChoiceCard({
  choiceKey,
  children,
  state = "idle",
  onSelect,
  feedbackTitle,
  feedback,
  feedbackAside,
  className,
}: ChoiceCardProps) {
  const revealed = state === "best" || state === "okay" || state === "poor";
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-[18px] px-3.5 py-[13px] text-sm leading-[1.35]",
        CARD[state],
        className,
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        disabled={revealed || !onSelect}
        aria-pressed={state === "selected"}
        className={cn(
          "flex w-full gap-2.5 rounded-xl text-left",
          "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lav-ink",
          revealed || !onSelect ? "cursor-default" : "cursor-pointer active:scale-[0.99]",
        )}
      >
        <span
          className={cn(
            "grid size-6 flex-none place-items-center rounded-lg text-xs font-extrabold",
            KEY[state],
          )}
        >
          {choiceKey}
        </span>
        <span>{children}</span>
      </button>
      {revealed && (feedback || feedbackTitle) && (
        <div className="relative rounded-xl bg-paper/65 py-2.5 pr-16 pl-3 text-[12.5px]">
          {feedbackTitle && (
            <b className="mb-0.5 block text-[13px]">{feedbackTitle}</b>
          )}
          {feedback}
          {feedbackAside && (
            <div className="absolute -right-1 -bottom-3.5 rotate-[10deg]">
              {feedbackAside}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
