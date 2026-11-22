"use client";

import type { ElementType } from "react";
import {
  HEADLINE_HIGHLIGHT,
  HEADLINE_SIZE,
  HEADLINE_TAG,
  type BracketHeadlineProps,
} from "./BracketHeadline";
import { RiseText } from "./Motion";
import { cn } from "./cn";

export type RiseHeadlineProps = BracketHeadlineProps & {
  /** Rise word by word or letter by letter. */
  by?: "words" | "letters";
  /** Seconds before the first piece moves. */
  delay?: number;
};

/** `BracketHeadline` that rises into place piece by piece. Centred by default. */
export function RiseHeadline({
  children,
  size = "h1",
  highlightTone = "lav-ink",
  as,
  by = "words",
  delay = 0,
  className,
}: RiseHeadlineProps) {
  const Tag: ElementType = as ?? HEADLINE_TAG[size];
  return (
    <Tag
      className={cn(
        "text-center font-extrabold",
        HEADLINE_SIZE[size],
        className,
      )}
    >
      <RiseText
        by={by}
        delay={delay}
        bracketClassName={HEADLINE_HIGHLIGHT[highlightTone]}
        className="block"
      >
        {children}
      </RiseText>
    </Tag>
  );
}
