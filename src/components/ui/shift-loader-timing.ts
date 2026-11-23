import type { ThemeColorName } from "@/styles/theme-color";

/** Timing and sequence rules for ShiftLoader, kept apart so they can be tested. */
export const SHIFT_TIMING = {
  /** Wait before anything shows, so fast loads never flash. */
  showDelayMs: 250,
  /** One loop: panels in, cross, panels out. */
  cycleMs: 1600,
  /** Panels sweep in until they cover the screen. */
  inMs: 640,
  /** The cross: the screen is covered, the word swaps, the objects spin. */
  holdMs: 260,
  /** The exit curtain parting. */
  exitMs: 650,
  /** Ready arrived while the panels were already sliding out: the cream veil just fades. */
  fadeMs: 400,
} as const;

/** Time left in a cycle after the cross, while the panels slide out the far sides. */
export const OUT_MS = SHIFT_TIMING.cycleMs - SHIFT_TIMING.inMs - SHIFT_TIMING.holdMs;

export const SHIFT_WORDS = ["learn", "build", "level up"] as const;

export type PanelTone = "lime" | "lav" | "ink";
const PANEL_ORDER: readonly PanelTone[] = ["lime", "lav", "ink"];

/** The two panels of a cycle: top-left one first. Rotates through lime, lavender, maroon. */
export function panelPair(cycle: number): [PanelTone, PanelTone] {
  const n = PANEL_ORDER.length;
  const i = ((cycle % n) + n) % n;
  return [PANEL_ORDER[i]!, PANEL_ORDER[(i + 1) % n]!];
}

/** Browser-bar colour while this cycle's top panel is on screen. */
export function themeColorFor(cycle: number): ThemeColorName {
  return panelPair(cycle)[0];
}

export function wordAt(words: readonly string[], crosses: number): string {
  if (words.length === 0) return "";
  return words[((crosses % words.length) + words.length) % words.length]!;
}

/**
 * What to do with the end of the cross (when the screen is fully covered):
 * leave through the curtain when the page is ready, otherwise slide on to the next pair.
 */
export function afterCross(ready: boolean): "exit" | "out" {
  return ready ? "exit" : "out";
}
