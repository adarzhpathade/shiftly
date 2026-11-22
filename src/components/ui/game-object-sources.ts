import type { GameObjectName } from "@/assets/objects";

/**
 * The ONE place that decides how each 3D object renders.
 *
 * Today every object is a hand-coded SVG stand-in (src/assets/objects.ts).
 * When an AI render is ready, drop `public/3d/<name>.webp` and flip that entry:
 *
 *   flame: { kind: "image", src: "/3d/flame.webp" },
 *
 * No component or screen needs to change.
 */
export type ObjectSource =
  | { kind: "svg" }
  | { kind: "image"; src: string };

export const OBJECT_SOURCES: Record<GameObjectName, ObjectSource> = {
  flame: { kind: "svg" },
  coin: { kind: "svg" },
  gift: { kind: "svg" },
  trophy: { kind: "svg" },
  megaphone: { kind: "svg" },
  bubble: { kind: "svg" },
  cloud: { kind: "svg" },
  puzzle: { kind: "svg" },
  rocket: { kind: "svg" },
  medal: { kind: "svg" },
  headset: { kind: "svg" },
  calendar: { kind: "svg" },
  target: { kind: "svg" },
  sparkle: { kind: "svg" },
  crown: { kind: "svg" },
};
