import { useId } from "react";
import { BUDDIES, isBuddyKey, stickerBody } from "@/assets/stickers";
import { renderSvgInner } from "@/assets/svg-art";
import { cn } from "./cn";
import { SOFT_BG_CLASS, type SoftTone } from "./tones";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

/** Legacy emoji avatars. Unknown keys fall back to initials. */
export const AVATAR_KEYS = {
  fox: "🦊",
  owl: "🦉",
  cat: "🐱",
  bear: "🐻",
  panda: "🐼",
  frog: "🐸",
} as const;

export type AvatarKey = keyof typeof AVATAR_KEYS;

export type AvatarProps = {
  name: string;
  /** `buddy-1`..`buddy-6` render the sticker buddy; legacy emoji keys still work. */
  avatarKey?: string;
  size?: AvatarSize;
  /** Backdrop tone. Buddies bring their own unless this is set. */
  tone?: SoftTone;
  className?: string;
};

const SIZE: Record<AvatarSize, string> = {
  sm: "size-8 text-xs",
  md: "size-11 text-sm",
  lg: "size-16 text-xl",
  xl: "size-24 text-3xl",
};

const EMOJI_SIZE: Record<AvatarSize, string> = {
  sm: "text-base",
  md: "text-2xl",
  lg: "text-4xl",
  xl: "text-6xl",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.charAt(0) ?? "";
  const last =
    parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? "") : "";
  return (first + last).toUpperCase();
}

/** Head-and-shoulders crop of the 120x130 sticker. */
const BUDDY_VIEWBOX = "18 6 92 92";

function BuddyArt({ buddy }: { buddy: (typeof BUDDIES)[keyof typeof BUDDIES] }) {
  const scope = useId();
  return (
    <svg
      viewBox={BUDDY_VIEWBOX}
      className="size-full"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{
        __html: renderSvgInner(stickerBody(buddy.pose, buddy.accessory), scope),
      }}
    />
  );
}

export function Avatar({
  name,
  avatarKey,
  size = "md",
  tone,
  className,
}: AvatarProps) {
  const buddy = isBuddyKey(avatarKey) ? BUDDIES[avatarKey] : null;
  const emoji =
    !buddy && avatarKey && avatarKey in AVATAR_KEYS
      ? AVATAR_KEYS[avatarKey as AvatarKey]
      : null;
  const resolvedTone: SoftTone = tone ?? buddy?.tone ?? "lav";
  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        "inline-grid flex-none place-items-center overflow-hidden rounded-full font-extrabold text-ink",
        SIZE[size],
        SOFT_BG_CLASS[resolvedTone],
        className,
      )}
    >
      {buddy ? (
        <BuddyArt buddy={buddy} />
      ) : (
        <span aria-hidden="true" className={emoji ? EMOJI_SIZE[size] : undefined}>
          {emoji ?? initials(name)}
        </span>
      )}
    </span>
  );
}
