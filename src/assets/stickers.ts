import { INK } from "./svg-art";

export type StickerPose = "wave" | "headset" | "cheer";

export const STICKER_VIEWBOX = "0 0 120 130";

const ARMS: Record<StickerPose, string> = {
  wave: `<path d="M37 82c-9 5-14 12-16 21"/><path d="M89 68c9-6 14-16 16-28"/><path d="M101 36l6-6M104 44l8-2"/>`,
  cheer: `<path d="M39 72c-9-8-14-20-16-32"/><path d="M89 68c9-8 13-19 15-31"/><path d="M18 34l-5-5M27 30l-1-8M104 33l5-5M96 28l1-8"/>`,
  headset: `<path d="M37 84c-6 6-8 14-7 21"/><path d="M89 84c6 6 8 14 7 21"/>`,
};

const HEADSET = `<path d="M38 56c0-30 54-30 54 0" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>
  <rect x="31" y="49" width="12" height="18" rx="5" fill="#E0352B" stroke="${INK}" stroke-width="3"/>
  <rect x="87" y="49" width="12" height="18" rx="5" fill="#E0352B" stroke="${INK}" stroke-width="3"/>
  <path d="M37 66c3 11 12 15 20 13" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="58" cy="79" r="3.5" fill="${INK}"/>`;

/** Loose, hand-drawn sticker character. The white edge comes from `url(#sticker)`. */
export function stickerBody(pose: StickerPose): string {
  return `<g filter="url(#sticker)">
    <g fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M40 118c-8-24-13-58 4-80 13-17 41-15 48 8 7 22 2 52-4 72l-11-1-3-11-14 1-2 11z" fill="#FFFFFF"/>
      ${ARMS[pose]}
      <path d="M51 61q4.5-5 9 0M69 61q4.5-5 9 0"/>
      <path d="M58 73q6 6 12 0"/>
    </g>
    ${pose === "headset" ? HEADSET : ""}
  </g>`;
}
