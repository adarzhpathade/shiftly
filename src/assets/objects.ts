export const GAME_OBJECT_NAMES = [
  "flame",
  "coin",
  "gift",
  "trophy",
  "megaphone",
  "bubble",
  "cloud",
  "puzzle",
  "rocket",
  "medal",
  "headset",
  "calendar",
  "target",
  "sparkle",
  "crown",
  "mailbox",
  "sprout",
  "gem",
] as const;

export type GameObjectName = (typeof GAME_OBJECT_NAMES)[number];

export const OBJECT_VIEWBOX = "0 0 100 100";

/** Hand-coded stand-ins for the AI 3D renders (first 8 ported from the preview). */
export const OBJECT_ART: Record<GameObjectName, string> = {
  flame: `<g filter="url(#drop)"><path d="M50 6c6 16 30 26 30 52a30 30 0 0 1-60 0c0-15 9-22 14-33 3 9 9 14 9 14 0-13 3-24 7-33z" fill="url(#gFlame)"/>
    <path d="M50 46c4 9 15 14 15 26a15 15 0 0 1-30 0c0-9 8-14 15-26z" fill="url(#gFlameIn)"/>
    <ellipse cx="38" cy="44" rx="4" ry="10" fill="#fff" opacity=".45" filter="url(#soft)"/></g>`,
  coin: `<g filter="url(#drop)"><ellipse cx="54" cy="52" rx="36" ry="38" fill="url(#gGoldEdge)"/>
    <ellipse cx="48" cy="50" rx="36" ry="38" fill="url(#gGold)"/>
    <ellipse cx="48" cy="50" rx="26" ry="28" fill="none" stroke="#FFE9A6" stroke-width="3" opacity=".8"/>
    <path d="M48 32l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="#FFF3C9"/>
    <ellipse cx="32" cy="30" rx="6" ry="11" fill="#fff" opacity=".5" transform="rotate(30 32 30)" filter="url(#soft)"/></g>`,
  gift: `<g filter="url(#drop)"><path d="M50 22l36 15-36 15-36-15z" fill="url(#gLavTop)"/>
    <path d="M14 37l36 15v38L14 75z" fill="url(#gLavL)"/>
    <path d="M50 52l36-15v38L50 90z" fill="url(#gLavR)"/>
    <path d="M28 31l36 15v38l-6 3V49L22 34z" fill="url(#gRed)" opacity=".95"/>
    <path d="M72 31L36 46v38l-6-3V44l36-15z" fill="url(#gRed)" opacity=".8"/>
    <path d="M50 37c-14-18-28-12-22-3 4 6 22 3 22 3zM50 37c14-18 28-12 22-3-4 6-22 3-22 3z" fill="url(#gRed)"/></g>`,
  trophy: `<g filter="url(#drop)"><path d="M26 14h48v24a24 24 0 0 1-48 0z" fill="url(#gGold)"/>
    <path d="M26 20H13c0 16 7 22 16 24M74 20h13c0 16-7 22-16 24" fill="none" stroke="url(#gGoldEdge)" stroke-width="6" stroke-linecap="round"/>
    <path d="M44 60h12v14H44z" fill="url(#gGoldEdge)"/>
    <path d="M30 74h40l4 14H26z" fill="url(#gPurple)"/>
    <ellipse cx="38" cy="28" rx="4" ry="10" fill="#fff" opacity=".55" filter="url(#soft)"/>
    <path d="M50 24l3.5 7 7.5.8-5.6 5 1.6 7.4L50 40.5l-7 3.7 1.6-7.4-5.6-5 7.5-.8z" fill="#FFF3C9"/></g>`,
  megaphone: `<g filter="url(#drop)"><path d="M16 42h14l40-22v58L30 58H16z" fill="url(#gCoral)"/>
    <ellipse cx="70" cy="49" rx="8" ry="29" fill="#FBD2C4"/>
    <ellipse cx="70" cy="49" rx="4" ry="17" fill="#C2412A"/>
    <path d="M22 58l5 22h12l-5-22" fill="url(#gWhite)"/>
    <rect x="10" y="42" width="8" height="16" rx="3" fill="#FBF7F0"/>
    <ellipse cx="42" cy="38" rx="10" ry="3.5" fill="#fff" opacity=".45" transform="rotate(-28 42 38)" filter="url(#soft)"/></g>`,
  bubble: `<g filter="url(#drop)"><path d="M20 14h60a12 12 0 0 1 12 12v34a12 12 0 0 1-12 12H48L28 88V72h-8A12 12 0 0 1 8 60V26a12 12 0 0 1 12-12z" fill="url(#gBlue)"/>
    <text x="50" y="57" text-anchor="middle" font-family="Bricolage Grotesque, sans-serif" font-weight="800" font-size="40" fill="#FFFFFF">?</text>
    <ellipse cx="24" cy="26" rx="8" ry="3.5" fill="#fff" opacity=".5" filter="url(#soft)"/></g>`,
  cloud: `<g filter="url(#drop)"><path d="M24 62a15 15 0 0 1 2-30 21 21 0 0 1 40-4 16 16 0 0 1 8 34z" fill="url(#gCloud)"/>
    <path d="M52 56l-11 18h10l-6 18 20-24H54l7-12z" fill="url(#gGold)"/>
    <ellipse cx="40" cy="30" rx="10" ry="4" fill="#fff" opacity=".35" filter="url(#soft)"/></g>`,
  puzzle: `<g filter="url(#drop)" transform="rotate(-10 50 50)"><path d="M14 26h20a9 9 0 1 1 18 0h20v20a9 9 0 1 1 0 18v20H52a9 9 0 1 0-18 0H14V64a9 9 0 1 0 0-18z" fill="url(#gPurple)"/>
    <ellipse cx="26" cy="36" rx="7" ry="3" fill="#fff" opacity=".5" filter="url(#soft)"/></g>`,

  // Simple matching stand-ins for objects not yet in the preview.
  rocket: `<g filter="url(#drop)" transform="rotate(35 50 50)"><path d="M50 4c14 12 18 34 14 56H36C32 38 36 16 50 4z" fill="url(#gWhite)"/>
    <path d="M36 60L22 76l4 6 12-6zM64 60l14 16-4 6-12-6z" fill="url(#gRed)"/>
    <circle cx="50" cy="34" r="8" fill="url(#gBlue)"/>
    <path d="M40 60h20l-4 8H44z" fill="url(#gGoldEdge)"/>
    <path d="M44 68h12c0 10-3 20-6 26-3-6-6-16-6-26z" fill="url(#gFlame)"/>
    <ellipse cx="43" cy="24" rx="3" ry="9" fill="#fff" opacity=".6" filter="url(#soft)"/></g>`,
  medal: `<g filter="url(#drop)"><path d="M28 6h16l10 32H38zM72 6H56L46 38h16z" fill="url(#gBlue)"/>
    <path d="M44 6h12l-6 20z" fill="url(#gRed)"/>
    <circle cx="52" cy="64" r="28" fill="url(#gGoldEdge)"/>
    <circle cx="49" cy="62" r="28" fill="url(#gGold)"/>
    <circle cx="49" cy="62" r="19" fill="none" stroke="#FFE9A6" stroke-width="3" opacity=".8"/>
    <path d="M49 49l4 9 10 1-7.5 6.5L58 76l-9-5-9 5 2.5-10.5L35 59l10-1z" fill="#FFF3C9"/>
    <ellipse cx="35" cy="48" rx="5" ry="9" fill="#fff" opacity=".5" transform="rotate(30 35 48)" filter="url(#soft)"/></g>`,
  headset: `<g filter="url(#drop)"><path d="M20 56C20 22 80 22 80 56" fill="none" stroke="url(#gPurple)" stroke-width="9" stroke-linecap="round"/>
    <rect x="12" y="48" width="20" height="32" rx="9" fill="url(#gCoral)"/>
    <rect x="68" y="48" width="20" height="32" rx="9" fill="url(#gCoral)"/>
    <path d="M78 78c0 12-10 16-26 16" fill="none" stroke="url(#gWhite)" stroke-width="5" stroke-linecap="round"/>
    <circle cx="50" cy="94" r="5" fill="url(#gGoldEdge)"/>
    <ellipse cx="19" cy="58" rx="2.5" ry="8" fill="#fff" opacity=".5" filter="url(#soft)"/></g>`,
  calendar: `<g filter="url(#drop)"><rect x="12" y="16" width="76" height="72" rx="14" fill="url(#gWhite)"/>
    <path d="M12 30a14 14 0 0 1 14-14h48a14 14 0 0 1 14 14v10H12z" fill="url(#gRed)"/>
    <rect x="28" y="8" width="8" height="18" rx="4" fill="url(#gGoldEdge)"/>
    <rect x="64" y="8" width="8" height="18" rx="4" fill="url(#gGoldEdge)"/>
    <g fill="url(#gLavR)"><circle cx="30" cy="54" r="4.5"/><circle cx="50" cy="54" r="4.5"/><circle cx="70" cy="54" r="4.5"/><circle cx="30" cy="72" r="4.5"/><circle cx="50" cy="72" r="4.5"/></g>
    <circle cx="70" cy="72" r="6.5" fill="url(#gLime)"/></g>`,
  crown: `<g filter="url(#drop)"><path d="M12 76L8 28l24 22 18-34 18 34 24-22-4 48z" fill="url(#gGold)"/>
    <rect x="12" y="76" width="76" height="12" rx="5" fill="url(#gGoldEdge)"/>
    <circle cx="8" cy="26" r="6" fill="#FFF3C9"/><circle cx="50" cy="14" r="6" fill="#FFF3C9"/><circle cx="92" cy="26" r="6" fill="#FFF3C9"/>
    <circle cx="30" cy="82" r="3" fill="#FFF3C9"/><circle cx="50" cy="82" r="3" fill="#FFF3C9"/><circle cx="70" cy="82" r="3" fill="#FFF3C9"/>
    <path d="M24 66l-2-20" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".45"/></g>`,
  sparkle: `<g filter="url(#drop)"><path d="M50 4l10 32 32 14-32 14-10 32-10-32-32-14 32-14z" fill="url(#gGold)"/>
    <path d="M50 22l5 21 21 7-21 7-5 21-5-21-21-7 21-7z" fill="#FFF3C9" opacity=".85"/></g>`,
  target: `<g filter="url(#drop)"><circle cx="46" cy="54" r="38" fill="url(#gRed)"/>
    <circle cx="46" cy="54" r="29" fill="url(#gWhite)"/>
    <circle cx="46" cy="54" r="20" fill="url(#gRed)"/>
    <circle cx="46" cy="54" r="11" fill="url(#gWhite)"/>
    <circle cx="46" cy="54" r="5" fill="url(#gRed)"/>
    <path d="M46 54L82 14" stroke="url(#gGoldEdge)" stroke-width="4" stroke-linecap="round"/>
    <path d="M76 8l10 2-2 10-6-3z" fill="url(#gLime)"/>
    <ellipse cx="26" cy="34" rx="5" ry="10" fill="#fff" opacity=".4" transform="rotate(40 26 34)" filter="url(#soft)"/></g>`,
  mailbox: `<g filter="url(#drop)"><path d="M16 46a34 34 0 0 1 68 0v40H16z" fill="url(#gBlue)"/>
    <path d="M16 46a34 34 0 0 1 34-34v74H16z" fill="url(#gBlue)"/>
    <path d="M50 12a34 34 0 0 1 34 34v40H50z" fill="#2E5FB5" opacity=".35"/>
    <rect x="30" y="40" width="40" height="8" rx="4" fill="#1F3F82"/>
    <rect x="44" y="84" width="12" height="12" rx="3" fill="url(#gGoldEdge)"/>
    <rect x="80" y="24" width="6" height="30" rx="3" fill="url(#gGoldEdge)"/>
    <path d="M86 24h12v10H86z" fill="url(#gRed)"/>
    <ellipse cx="28" cy="40" rx="4" ry="12" fill="#fff" opacity=".4" filter="url(#soft)"/></g>`,
  sprout: `<g filter="url(#drop)"><path d="M26 92c0-12 10-20 24-20s24 8 24 20z" fill="url(#gCoral)"/>
    <path d="M50 74V44" stroke="#5E8A1E" stroke-width="6" stroke-linecap="round"/>
    <path d="M50 52C32 52 18 42 16 24c18-2 32 6 34 28z" fill="url(#gLime)"/>
    <path d="M50 46c2-18 16-28 34-26-2 18-16 28-34 26z" fill="url(#gLime)"/>
    <ellipse cx="30" cy="32" rx="3" ry="7" fill="#fff" opacity=".5" transform="rotate(-40 30 32)" filter="url(#soft)"/></g>`,
  gem: `<g filter="url(#drop)"><path d="M30 18h40l22 24-42 48L8 42z" fill="url(#gBlue)"/>
    <path d="M8 42h84L50 90z" fill="url(#gBlue)" opacity=".85"/>
    <path d="M30 18l-8 24 28 48 28-48-8-24z" fill="#CFE2FA" opacity=".55"/>
    <path d="M30 18l20 24 20-24M22 42h56M50 42v48" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round" opacity=".7"/>
    <ellipse cx="30" cy="30" rx="4" ry="8" fill="#fff" opacity=".6" transform="rotate(25 30 30)" filter="url(#soft)"/></g>`,
};
