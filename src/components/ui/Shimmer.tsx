import type { HTMLAttributes } from "react";
import { Sticker, type StickerProps } from "./Sticker";
import { cn } from "./cn";

export type ShimmerTone = "ink" | "lime" | "lav" | "peach" | "sky" | "paper";

const BASE: Record<ShimmerTone, string> = {
  ink: "bg-ink/10",
  lime: "bg-lime/45",
  lav: "bg-lav/45",
  peach: "bg-peach/55",
  sky: "bg-sky/50",
  paper: "bg-paper/80",
};

export type ShimmerProps = HTMLAttributes<HTMLDivElement> & {
  /** Tint of the block: use the tone of the page it stands in for. */
  tone?: ShimmerTone;
  /** A tiny buddy peeking up from the bottom edge. Use on the first card only. */
  peek?: StickerProps["pose"];
};

/**
 * Soft skeleton block: a tinted slab with a light sweep passing over it. The sweep only
 * moves transform; with reduced motion it is absent and the block stays still.
 * Size and shape come from `className`.
 */
export function Shimmer({ tone = "ink", peek, className, children, ...rest }: ShimmerProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("relative overflow-hidden", BASE[tone], className)}
      {...rest}
    >
      <span className="pointer-events-none absolute inset-0 hidden bg-linear-to-r from-transparent via-paper/70 to-transparent motion-safe:block motion-safe:animate-shimmer" />
      {peek && (
        <Sticker pose={peek} size={64} className="absolute right-5 -bottom-8 rotate-6 opacity-90" />
      )}
      {children}
    </div>
  );
}
