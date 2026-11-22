/** Shared tone maps. Full class strings so Tailwind can see them. */

export type SurfaceTone = "paper" | "peach" | "sky" | "lav" | "lime" | "ink";

export const SURFACE_CLASS: Record<SurfaceTone, string> = {
  paper: "bg-paper text-ink",
  peach: "bg-peach text-ink",
  sky: "bg-sky text-ink",
  lav: "bg-lav text-ink",
  lime: "bg-lime text-ink",
  ink: "bg-ink text-cream",
};

export type ChipTone = "lime" | "lav" | "peach" | "sky" | "paper";

export const CHIP_CLASS: Record<ChipTone, string> = {
  lime: "bg-lime",
  lav: "bg-lav",
  peach: "bg-peach",
  sky: "bg-sky",
  paper: "bg-paper",
};

export type SoftTone = "peach" | "sky" | "lav" | "lime" | "paper" | "muted";

export const SOFT_BG_CLASS: Record<SoftTone, string> = {
  peach: "bg-peach",
  sky: "bg-sky",
  lav: "bg-lav",
  lime: "bg-lime",
  paper: "bg-paper",
  muted: "bg-muted",
};
