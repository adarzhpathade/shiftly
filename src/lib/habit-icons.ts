/**
 * Single source for habit icon keys: the keys stored on a habit/template map to a
 * kit 3D object (lists, pickers) and an emoji (compact spots such as onboarding).
 */
import type { GameObjectName } from "@/assets/objects";

export interface HabitIcon {
  readonly key: string;
  readonly label: string;
  readonly emoji: string;
  readonly object: GameObjectName;
}

export const HABIT_ICONS: readonly HabitIcon[] = [
  { key: "clock", label: "On time", emoji: "⏰", object: "calendar" },
  { key: "bubble", label: "Talk", emoji: "💬", object: "bubble" },
  { key: "check", label: "Done", emoji: "✅", object: "trophy" },
  { key: "handshake", label: "Team", emoji: "🤝", object: "puzzle" },
  { key: "phone", label: "Call", emoji: "📞", object: "headset" },
  { key: "book", label: "Learn", emoji: "📘", object: "medal" },
  { key: "target", label: "Focus", emoji: "🎯", object: "target" },
  { key: "rocket", label: "Launch", emoji: "🚀", object: "rocket" },
  { key: "sparkle", label: "Shine", emoji: "✨", object: "sparkle" },
  { key: "megaphone", label: "Speak up", emoji: "📣", object: "megaphone" },
];

const BY_KEY = new Map(HABIT_ICONS.map((i) => [i.key, i]));
const FALLBACK = BY_KEY.get("sparkle") as HabitIcon;

export function habitIcon(key: string): HabitIcon {
  return BY_KEY.get(key) ?? FALLBACK;
}

export const habitEmoji = (key: string): string => habitIcon(key).emoji;
export const habitObject = (key: string): GameObjectName => habitIcon(key).object;
