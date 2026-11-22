import { GAME_OBJECT_NAMES, type GameObjectName } from "@/components/ui";
import type { ColorToken } from "@/lib/types";

/** Full class strings so Tailwind can see them. */
export const TONE_BG: Record<ColorToken, string> = {
  peach: "bg-peach",
  sky: "bg-sky",
  lav: "bg-lav",
  lime: "bg-lime",
};

export function objectFor(key: string): GameObjectName {
  return (GAME_OBJECT_NAMES as readonly string[]).includes(key)
    ? (key as GameObjectName)
    : "trophy";
}
