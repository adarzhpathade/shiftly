import type { HTMLAttributes } from "react";
import { cn } from "./cn";
import { SURFACE_CLASS, type SurfaceTone } from "./tones";

export type CardPadding = "none" | "sm" | "md" | "lg";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  tone?: SurfaceTone;
  padding?: CardPadding;
};

const PADDING: Record<CardPadding, string> = {
  none: "",
  sm: "p-3",
  md: "p-[14px]",
  lg: "p-5",
};

export function Card({
  tone = "paper",
  padding = "md",
  className,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-card",
        SURFACE_CLASS[tone],
        PADDING[padding],
        className,
      )}
      {...rest}
    />
  );
}
