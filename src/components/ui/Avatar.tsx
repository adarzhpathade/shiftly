import { cn } from "./cn";
import { SOFT_BG_CLASS, type SoftTone } from "./tones";

export type AvatarSize = "sm" | "md" | "lg";

/** Picked-in-setup avatars. Unknown keys fall back to initials. */
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
  avatarKey?: string;
  size?: AvatarSize;
  tone?: SoftTone;
  className?: string;
};

const SIZE: Record<AvatarSize, string> = {
  sm: "size-8 text-xs",
  md: "size-11 text-sm",
  lg: "size-16 text-xl",
};

const EMOJI_SIZE: Record<AvatarSize, string> = {
  sm: "text-base",
  md: "text-2xl",
  lg: "text-4xl",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.charAt(0) ?? "";
  const last =
    parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? "") : "";
  return (first + last).toUpperCase();
}

export function Avatar({
  name,
  avatarKey,
  size = "md",
  tone = "lav",
  className,
}: AvatarProps) {
  const emoji =
    avatarKey && avatarKey in AVATAR_KEYS
      ? AVATAR_KEYS[avatarKey as AvatarKey]
      : null;
  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        "inline-grid flex-none place-items-center rounded-full font-extrabold text-ink",
        SIZE[size],
        SOFT_BG_CLASS[tone],
        className,
      )}
    >
      <span aria-hidden="true" className={emoji ? EMOJI_SIZE[size] : undefined}>
        {emoji ?? initials(name)}
      </span>
    </span>
  );
}
