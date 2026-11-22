/**
 * Hand-coded stand-in art ported from design/style-preview.html.
 * Raw hex colours are allowed here (src/assets). Art is stored as static SVG
 * strings that reference gradients/filters by their bare id (e.g. `url(#gFlame)`,
 * `filter="url(#drop)"`). `renderSvgInner` prefixes those ids with a scope so
 * many instances can live on one page without colliding.
 */

export const INK = "#3B0D12";

type Stop = [offset: number, color: string];
type Gradient = {
  kind: "radial" | "linear";
  attrs: string;
  stops: Stop[];
};

const DIAG = 'x1="0" y1="0" x2="1" y2="1"';
const VERT = 'x1="0" y1="0" x2="0" y2="1"';

export const GRADIENTS: Record<string, Gradient> = {
  gFlame: {
    kind: "radial",
    attrs: 'cx="45%" cy="70%" r="65%"',
    stops: [[0, "#FFC24A"], [0.45, "#F7722E"], [1, "#C92A18"]],
  },
  gFlameIn: {
    kind: "radial",
    attrs: 'cx="45%" cy="65%" r="60%"',
    stops: [[0, "#FFF6C4"], [0.6, "#FFD34D"], [1, "#F7A12E"]],
  },
  gGold: {
    kind: "linear",
    attrs: DIAG,
    stops: [[0, "#FFE48A"], [0.45, "#F5B83D"], [1, "#C47F12"]],
  },
  gGoldEdge: { kind: "linear", attrs: VERT, stops: [[0, "#D69420"], [1, "#9A5F0A"]] },
  gLavTop: { kind: "linear", attrs: DIAG, stops: [[0, "#E6E0FF"], [1, "#C9BFFA"]] },
  gLavL: { kind: "linear", attrs: VERT, stops: [[0, "#BDB2F5"], [1, "#A396EE"]] },
  gLavR: { kind: "linear", attrs: VERT, stops: [[0, "#9385E6"], [1, "#7565D6"]] },
  gRed: {
    kind: "linear",
    attrs: DIAG,
    stops: [[0, "#FF7A61"], [0.5, "#E0352B"], [1, "#A81E17"]],
  },
  gCoral: {
    kind: "linear",
    attrs: DIAG,
    stops: [[0, "#FFA58C"], [0.55, "#F26B4F"], [1, "#C2412A"]],
  },
  gWhite: {
    kind: "linear",
    attrs: DIAG,
    stops: [[0, "#FFFFFF"], [0.6, "#EEF2F8"], [1, "#C5CFDE"]],
  },
  gBlue: {
    kind: "linear",
    attrs: DIAG,
    stops: [[0, "#8FB7F2"], [0.55, "#4F86E0"], [1, "#2E5FB5"]],
  },
  gCloud: { kind: "linear", attrs: VERT, stops: [[0, "#8E8AA8"], [1, "#55506F"]] },
  gLime: {
    kind: "linear",
    attrs: DIAG,
    stops: [[0, "#EEF57A"], [0.55, "#D4DE3A"], [1, "#A3AD1C"]],
  },
  gPurple: {
    kind: "linear",
    attrs: DIAG,
    stops: [[0, "#D3CBFF"], [0.5, "#9C8CF0"], [1, "#6B59D1"]],
  },
};

const FILTERS: Record<string, string> = {
  sticker: `<filter id="sticker" x="-50%" y="-50%" width="200%" height="200%">
      <feMorphology in="SourceAlpha" operator="dilate" radius="5" result="grow"/>
      <feFlood flood-color="#FFFFFF"/>
      <feComposite in2="grow" operator="in" result="halo"/>
      <feDropShadow in="halo" dx="0" dy="3" stdDeviation="3" flood-color="${INK}" flood-opacity=".18" result="haloShadow"/>
      <feMerge><feMergeNode in="haloShadow"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>`,
  drop: `<filter id="drop" x="-60%" y="-60%" width="220%" height="240%">
      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="${INK}" flood-opacity=".28"/>
    </filter>`,
  soft: `<filter id="soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2"/></filter>`,
};

const REF = /url\(#(\w+)\)/g;

/** The `<defs>` markup needed by `body` (only the gradients and filters it uses). */
function defsFor(body: string): string {
  const used = new Set<string>();
  for (const m of body.matchAll(REF)) if (m[1]) used.add(m[1]);
  const parts: string[] = [];
  for (const id of used) {
    const filter = FILTERS[id];
    if (filter) {
      parts.push(filter);
      continue;
    }
    const g = GRADIENTS[id];
    if (!g) continue;
    const tag = g.kind === "radial" ? "radialGradient" : "linearGradient";
    const stops = g.stops
      .map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`)
      .join("");
    parts.push(`<${tag} id="${id}" ${g.attrs}>${stops}</${tag}>`);
  }
  return `<defs>${parts.join("")}</defs>`;
}

/**
 * Complete inner-SVG markup (defs + body) with every id and `url(#id)` reference
 * prefixed by `scope`, so repeated instances never collide. `scope` should come
 * from React `useId` (sanitised to word characters).
 */
export function renderSvgInner(body: string, scope: string): string {
  const safe = scope.replace(/\W/g, "");
  return (defsFor(body) + body)
    .replace(REF, (_m, id: string) => `url(#${safe}-${id})`)
    .replace(/\bid="(\w+)"/g, (_m, id: string) => `id="${safe}-${id}"`);
}
