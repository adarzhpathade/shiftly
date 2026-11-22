import type { HTMLAttributes } from "react";
import { cn } from "./cn";
import { CHIP_CLASS, type ChipTone } from "./tones";

export type ChipProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: ChipTone;
};

export function Chip({ tone = "lime", className, ...rest }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-block rounded-pill px-2.5 py-[5px] text-[11px] leading-none font-bold tracking-[0.06em] text-ink uppercase",
        CHIP_CLASS[tone],
        className,
      )}
      {...rest}
    />
  );
}
