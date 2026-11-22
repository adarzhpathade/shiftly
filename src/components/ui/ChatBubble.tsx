import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type ChatBubbleProps = HTMLAttributes<HTMLDivElement> & {
  /** `customer` sits left on paper; `user` sits right in ink. */
  from?: "customer" | "user";
};

export function ChatBubble({
  from = "customer",
  className,
  ...rest
}: ChatBubbleProps) {
  const user = from === "user";
  return (
    <div
      className={cn(
        "max-w-[88%] px-4 py-3.5 text-base leading-[1.35] font-medium",
        user
          ? "ml-auto rounded-[22px_6px_22px_22px] bg-ink text-cream"
          : "rounded-[6px_22px_22px_22px] bg-paper text-ink",
        className,
      )}
      {...rest}
    />
  );
}
