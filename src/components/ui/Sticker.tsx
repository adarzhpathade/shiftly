import { useId, type CSSProperties } from "react";
import { STICKER_VIEWBOX, stickerBody, type StickerPose } from "@/assets/stickers";
import { renderSvgInner } from "@/assets/svg-art";
import { cn } from "./cn";

export type { StickerPose };

export type StickerProps = {
  pose: StickerPose;
  /** Rendered width in px; height follows the 120:130 aspect ratio. */
  size?: number;
  /** Accessible label. Omit for purely decorative stickers. */
  label?: string;
  className?: string;
  style?: CSSProperties;
};

/** The loose hand-drawn sticker buddy with a white sticker edge. */
export function Sticker({ pose, size = 96, label, className, style }: StickerProps) {
  const scope = useId();
  return (
    <svg
      viewBox={STICKER_VIEWBOX}
      width={size}
      height={(size * 130) / 120}
      className={cn("overflow-visible", className)}
      style={style}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      dangerouslySetInnerHTML={{
        __html: renderSvgInner(stickerBody(pose), scope),
      }}
    />
  );
}
