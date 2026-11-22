import { INK } from "./svg-art";

export type StickerPose = "wave" | "headset" | "cheer" | "think";

export const STICKER_VIEWBOX = "0 0 120 130";

const ARMS: Record<StickerPose, string> = {
  wave: `<path d="M37 82c-9 5-14 12-16 21"/><path d="M89 68c9-6 14-16 16-28"/><path d="M101 36l6-6M104 44l8-2"/>`,
  cheer: `<path d="M39 72c-9-8-14-20-16-32"/><path d="M89 68c9-8 13-19 15-31"/><path d="M18 34l-5-5M27 30l-1-8M104 33l5-5M96 28l1-8"/>`,
  think: `<path d="M37 84c-6 6-8 14-7 21"/><path d="M89 84c-3-8-10-12-17-9"/><path d="M99 40c0-4 5-4 5 0 0 3-4 3-4 6M100 52v1"/>`,
  headset: `<path d="M37 84c-6 6-8 14-7 21"/><path d="M89 84c6 6 8 14 7 21"/>`,
};

export type BuddyAccessory = "none" | "cap" | "glasses" | "bow" | "crown";

const ACC_STROKE = `fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`;

/** Small extras drawn on top of the buddy so the six avatars feel different. */
const ACCESSORIES: Record<BuddyAccessory, string> = {
  none: "",
  cap: `<g ${ACC_STROKE}><path d="M45 40c2-22 44-24 48 2z" fill="#E0352B"/><path d="M88 41c8-1 14 0 18 3" fill="#E0352B"/></g>`,
  glasses: `<g ${ACC_STROKE}><circle cx="55.5" cy="61" r="8" fill="#FFFFFF" fill-opacity=".5"/><circle cx="73.5" cy="61" r="8" fill="#FFFFFF" fill-opacity=".5"/><path d="M63.5 61h2"/></g>`,
  bow: `<g ${ACC_STROKE}><path d="M82 30l-10-7v14z" fill="#F7C9A8"/><path d="M82 30l10-7v14z" fill="#F7C9A8"/><circle cx="82" cy="30" r="3" fill="#E0352B"/></g>`,
  crown: `<g ${ACC_STROKE}><path d="M52 38l-2-17 9 7 8-10 8 10 9-7-2 17z" fill="#F5B83D"/></g>`,
};

const HEADSET = `<path d="M38 56c0-30 54-30 54 0" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>
  <rect x="31" y="49" width="12" height="18" rx="5" fill="#E0352B" stroke="${INK}" stroke-width="3"/>
  <rect x="87" y="49" width="12" height="18" rx="5" fill="#E0352B" stroke="${INK}" stroke-width="3"/>
  <path d="M37 66c3 11 12 15 20 13" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="58" cy="79" r="3.5" fill="${INK}"/>`;

/** Loose, hand-drawn sticker character. The white edge comes from `url(#sticker)`. */
export function stickerBody(pose: StickerPose, accessory: BuddyAccessory = "none"): string {
  return `<g filter="url(#sticker)">
    <g fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M40 118c-8-24-13-58 4-80 13-17 41-15 48 8 7 22 2 52-4 72l-11-1-3-11-14 1-2 11z" fill="#FFFFFF"/>
      ${ARMS[pose]}
      <path d="M51 61q4.5-5 9 0M69 61q4.5-5 9 0"/>
      <path d="M58 73q6 6 12 0"/>
    </g>
    ${pose === "headset" ? HEADSET : ""}
    ${ACCESSORIES[accessory]}
  </g>`;
}

export type BuddyKey = "buddy-1" | "buddy-2" | "buddy-3" | "buddy-4" | "buddy-5" | "buddy-6";

export const BUDDY_KEYS: readonly BuddyKey[] = [
  "buddy-1",
  "buddy-2",
  "buddy-3",
  "buddy-4",
  "buddy-5",
  "buddy-6",
];

export type BuddyTone = "lime" | "lav" | "peach" | "sky" | "paper" | "red";

/** The six pickable buddies: same sticker character, different pose, accessory and backdrop. */
export const BUDDIES: Record<BuddyKey, { pose: StickerPose; accessory: BuddyAccessory; tone: BuddyTone; label: string }> = {
  "buddy-1": { pose: "wave", accessory: "none", tone: "lime", label: "Sunny" },
  "buddy-2": { pose: "headset", accessory: "none", tone: "lav", label: "Ace" },
  "buddy-3": { pose: "cheer", accessory: "bow", tone: "peach", label: "Bowie" },
  "buddy-4": { pose: "wave", accessory: "cap", tone: "sky", label: "Cappy" },
  "buddy-5": { pose: "headset", accessory: "glasses", tone: "paper", label: "Nerdy" },
  "buddy-6": { pose: "cheer", accessory: "crown", tone: "red", label: "Royal" },
};

export function isBuddyKey(key: string | undefined): key is BuddyKey {
  return !!key && key in BUDDIES;
}
