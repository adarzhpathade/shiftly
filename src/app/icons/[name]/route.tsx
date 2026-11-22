import { ImageResponse } from "next/og";
import { BRAND_CREAM, BRAND_INK, BRAND_LIME } from "@/styles/brand-colors";

type IconSpec = { size: number; maskable: boolean; square: boolean };

const ICONS: Record<string, IconSpec> = {
  "icon-192": { size: 192, maskable: false, square: false },
  "icon-512": { size: 512, maskable: false, square: false },
  "maskable-512": { size: 512, maskable: true, square: true },
  "apple-180": { size: 180, maskable: false, square: true },
  "favicon-32": { size: 32, maskable: false, square: false },
};

export function generateStaticParams() {
  return Object.keys(ICONS).map((name) => ({ name }));
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ name: string }> },
) {
  const { name } = await ctx.params;
  const spec = Object.hasOwn(ICONS, name) ? ICONS[name] : undefined;
  if (!spec) return new Response("Not found", { status: 404 });

  const { size, maskable, square } = spec;
  // Maskable icons keep the glyph inside the central safe zone.
  const glyph = Math.round(size * (maskable ? 0.5 : 0.66));
  const radius = square ? 0 : Math.round(size * 0.22);

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND_INK,
          borderRadius: radius,
        }}
      >
        <svg width={glyph} height={glyph} viewBox="0 0 100 100">
          <path
            d="M 70 30 C 62 20, 30 20, 30 37 C 30 53, 70 47, 70 64 C 70 81, 36 81, 28 70"
            fill="none"
            stroke={BRAND_CREAM}
            strokeWidth="15"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="82" cy="84" r="9" fill={BRAND_LIME} />
        </svg>
      </div>
    ),
    {
      width: size,
      height: size,
      headers: { "Cache-Control": "public, max-age=86400, must-revalidate" },
    },
  );
}
