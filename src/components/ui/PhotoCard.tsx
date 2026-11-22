import Image from "next/image";
import type { ReactNode } from "react";
import { BracketHeadline } from "./BracketHeadline";
import { Chip } from "./Chip";
import type { ChipTone } from "./tones";
import { Sticker, type StickerPose } from "./Sticker";
import { cn } from "./cn";

export type PhotoCardProps = {
  /** Photo URL. Omit for the gradient placeholder. */
  src?: string;
  alt?: string;
  /** Text on the placeholder, e.g. "Photo: support agent on a call". */
  placeholderLabel?: string;
  chip?: string;
  chipTone?: ChipTone;
  /** Headline; `[word]` segments get the paper/lav highlight. */
  title: string;
  /** CTA slot, e.g. a small Button. */
  cta?: ReactNode;
  /** Sticker peeking over the top-right corner. */
  sticker?: StickerPose;
  className?: string;
};

export function PhotoCard({
  src,
  alt = "",
  placeholderLabel,
  chip,
  chipTone = "lime",
  title,
  cta,
  sticker,
  className,
}: PhotoCardProps) {
  return (
    <div className={cn("relative h-[230px] rounded-[26px]", className)}>
      <div className="absolute inset-0 overflow-hidden rounded-[26px]">
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 480px) 100vw, 480px"
            className="object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 70% 38%, var(--color-peach) 0 16%, transparent 17%), radial-gradient(ellipse at 70% 80%, var(--color-lav-ink) 0 30%, transparent 31%), linear-gradient(180deg, var(--color-sky) 0%, var(--color-sky) 40%, var(--color-lav-ink) 100%)",
            }}
          />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-b from-transparent from-35% to-ink/60"
        />
      </div>
      {!src && placeholderLabel && (
        <span className="absolute top-[46px] left-4 z-10 text-[9px] font-bold tracking-[0.08em] text-paper/80 uppercase">
          {placeholderLabel}
        </span>
      )}
      {chip && (
        <Chip tone={chipTone} className="absolute top-3.5 left-3.5 z-10">
          {chip}
        </Chip>
      )}
      <BracketHeadline
        as="h3"
        size="h2"
        highlightTone="lav"
        className="absolute right-[90px] bottom-[50px] left-4 z-10 text-[30px] text-white"
      >
        {title}
      </BracketHeadline>
      {cta && <div className="absolute bottom-3.5 left-4 z-10">{cta}</div>}
      {sticker && (
        <Sticker
          pose={sticker}
          size={92}
          className="absolute -top-[42px] -right-1.5 z-20 rotate-[8deg]"
        />
      )}
    </div>
  );
}
