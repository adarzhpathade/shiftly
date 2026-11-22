import { Fragment, type ElementType, type ReactNode } from "react";
import { cn } from "./cn";

export type HeadlineSize = "poster" | "display" | "h1" | "h2" | "h3";
export type HighlightTone = "lav-ink" | "lav" | "paper";

export type BracketHeadlineProps = {
  /** Text where `[word]` segments become the highlighted bracket word. `\n` breaks the line. */
  children: string;
  size?: HeadlineSize;
  /** lav-ink on light backgrounds; paper/lav on coloured or photo backgrounds. */
  highlightTone?: HighlightTone;
  as?: ElementType;
  className?: string;
};

const SIZE: Record<HeadlineSize, string> = {
  /** Giant poster word that still fits "[LEARN]" on a 360px screen. */
  poster: "text-[clamp(3.4rem,20vw,5.5rem)] leading-[0.82] tracking-[-0.06em]",
  display:
    "text-[clamp(4.5rem,26vw,6.5rem)] leading-[0.82] tracking-[-0.06em]",
  h1: "text-4xl leading-[0.95] tracking-[-0.035em]",
  h2: "text-[30px] leading-[0.95] tracking-[-0.03em]",
  h3: "text-[22px] leading-none tracking-[-0.02em]",
};

const HIGHLIGHT: Record<HighlightTone, string> = {
  "lav-ink": "text-lav-ink",
  lav: "text-lav",
  paper: "text-paper",
};

const DEFAULT_TAG: Record<HeadlineSize, ElementType> = {
  poster: "h1",
  display: "h1",
  h1: "h1",
  h2: "h2",
  h3: "h3",
};

function renderLine(
  line: string,
  tone: HighlightTone,
  lineKey: number,
): ReactNode[] {
  return line.split(/(\[[^\]]+\])/g).map((part, i) =>
    /^\[[^\]]+\]$/.test(part) ? (
      <span
        key={`${lineKey}-${i}`}
        data-bracket=""
        className={HIGHLIGHT[tone]}
      >
        {part}
      </span>
    ) : (
      <Fragment key={`${lineKey}-${i}`}>{part}</Fragment>
    ),
  );
}

export function BracketHeadline({
  children,
  size = "h1",
  highlightTone = "lav-ink",
  as,
  className,
}: BracketHeadlineProps) {
  const Tag = as ?? DEFAULT_TAG[size];
  const lines = children.split("\n");
  return (
    <Tag className={cn("font-extrabold", SIZE[size], className)}>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {renderLine(line, highlightTone, i)}
        </Fragment>
      ))}
    </Tag>
  );
}
