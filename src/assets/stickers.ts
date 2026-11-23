import { INK } from "./svg-art";

export type StickerPose =
  | "wave"
  | "headset"
  | "cheer"
  | "think"
  /** Arms out wide, ready to hold a sign (the sign itself is drawn by PeekBuddy). */
  | "sign"
  /** Both hands over the eyes (the login buddy while the password is typed). */
  | "cover"
  /** One thumb up. */
  | "thumbs"
  /** Shrug with a flat mouth. */
  | "shrug"
  /** Worried, holding up a lost key (forgot password). */
  | "key";

export const STICKER_VIEWBOX = "0 0 120 130";

const ARMS: Record<StickerPose, string> = {
  sign: `<path d="M37 84c-10 2-16 6-18 14"/><path d="M89 84c10 2 16 6 18 14"/>`,
  cover: `<path d="M38 92c-6-8-3-18 9-23"/><path d="M89 90c6-8 4-16-6-22"/>`,
  thumbs: `<path d="M37 84c-6 6-8 14-7 21"/><path d="M89 72c9-3 14-13 14-24"/>`,
  shrug: `<path d="M37 84c-10 4-18 2-20-8"/><path d="M89 84c10 4 18 2 20-8"/>`,
  key: `<path d="M37 84c-6 6-8 14-7 21"/><path d="M89 74c8-3 12-10 13-19"/>`,
  wave: `<path d="M37 82c-9 5-14 12-16 21"/><path d="M89 68c9-6 14-16 16-28"/><path d="M101 36l6-6M104 44l8-2"/>`,
  cheer: `<path d="M39 72c-9-8-14-20-16-32"/><path d="M89 68c9-8 13-19 15-31"/><path d="M18 34l-5-5M27 30l-1-8M104 33l5-5M96 28l1-8"/>`,
  think: `<path d="M37 84c-6 6-8 14-7 21"/><path d="M89 84c-3-8-10-12-17-9"/><path d="M99 40c0-4 5-4 5 0 0 3-4 3-4 6M100 52v1"/>`,
  headset: `<path d="M37 84c-6 6-8 14-7 21"/><path d="M89 84c6 6 8 14 7 21"/>`,
};

const SMILE_EYES = `<path d="M51 61q4.5-5 9 0M69 61q4.5-5 9 0"/><path d="M58 73q6 6 12 0"/>`;

/** Faces that differ from the default smile. */
const FACES: Partial<Record<StickerPose, string>> = {
  cover: `<path d="M59 76q5 3 10 0"/>`,
  shrug: `<path d="M51 62h9M69 62h9"/><path d="M56 75q3-3 6 0t6 0t6 0"/>`,
  key: `<path d="M51 63q4.5-4 9 0M69 63q4.5-4 9 0"/><path d="M49 57l10-3M79 57l-10-3"/><path d="M58 77q6-5 12 0"/>`,
};

/** Hands and held objects, drawn after the arms. */
const EXTRAS: Partial<Record<StickerPose, string>> = {
  sign: `<circle cx="19" cy="98" r="5" fill="#FFFFFF"/><circle cx="107" cy="98" r="5" fill="#FFFFFF"/>`,
  cover: `<ellipse cx="54" cy="62" rx="10.5" ry="7" fill="#FFFFFF" transform="rotate(-8 54 62)"/><ellipse cx="75" cy="62" rx="10.5" ry="7" fill="#FFFFFF" transform="rotate(8 75 62)"/><path d="M47 57q3-3 6-3M59 58q-1-3-4-4M70 58q1-3 4-4M81 57q-3-3-6-3" stroke-width="2.5"/>`,
  thumbs: `<path d="M98 45c-1.5-9 0-15 5-15s6.5 6 5 15z" fill="#FFFFFF"/><circle cx="103" cy="50" r="8.5" fill="#FFFFFF"/><path d="M97.5 51h11"/>`,
  shrug: `<circle cx="17" cy="73" r="5" fill="#FFFFFF"/><circle cx="109" cy="73" r="5" fill="#FFFFFF"/>`,
  key: `<circle cx="104" cy="34" r="8" fill="#F5B83D"/><circle cx="104" cy="34" r="2.5" fill="#FFFFFF" stroke-width="2"/><path d="M104 42v24M104 56h7M104 62h5"/><circle cx="102" cy="55" r="4.5" fill="#FFFFFF"/>`,
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
      ${FACES[pose] ?? SMILE_EYES}
      ${EXTRAS[pose] ?? ""}
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
