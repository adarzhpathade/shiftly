import { ChatBubble } from "./ChatBubble";
import { LoadingDots } from "./LoadingDots";
import { cn } from "./cn";

export type TypingBubbleProps = {
  /** Spoken label for screen readers. */
  label?: string;
  className?: string;
};

/** "Customer is typing": a paper chat bubble with three bouncing ink dots. */
export function TypingBubble({ label = "Customer is typing", className }: TypingBubbleProps) {
  return (
    <ChatBubble
      role="status"
      aria-label={label}
      className={cn("flex w-fit items-center rounded-[6px_22px_22px_22px] px-[18px] py-[15px] text-ink/55", className)}
    >
      <LoadingDots dotClass="size-2.5" />
    </ChatBubble>
  );
}
