/**
 * Loader visual check at 360x800 @2x. Needs `next dev -p 3107` running.
 *   pnpm exec tsx scripts/screens-loaders.ts
 */
import { mkdirSync, renameSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3107";
const OUT =
  process.env.SCREENS_OUT ??
  "D:/Video Creation/remotion-tmp/claude/090905147524e1df/b8526b5c-1e8e-49a7-9685-335515e6525b/scratchpad/loaders";
mkdirSync(OUT, { recursive: true });

const UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";

async function stage(page: Page, name: string, timeout = 8000) {
  await page.waitForSelector(`[data-shift-loader][data-stage="${name}"]`, { timeout });
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log("shot", name);
}

async function main() {
  const browser = await chromium.launch();
  const base = { viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: UA };

  for (const scheme of ["light", "dark"] as const) {
    const ctx = await browser.newContext({ ...base, colorScheme: scheme });
    const page = await ctx.newPage();
    page.setDefaultTimeout(30000);
    await page.goto(`${BASE}/dev/loaders`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Replay" }).click();
    await stage(page, "in");
    await page.waitForTimeout(260);
    await shot(page, `shift-${scheme}-1-enter`);
    await stage(page, "hold");
    await page.waitForTimeout(40);
    await shot(page, `shift-${scheme}-2-cross`);
    await stage(page, "out");
    await page.waitForTimeout(250);
    await shot(page, `shift-${scheme}-3-slide-out`);
    if (scheme === "light") {
      await stage(page, "in");
      await page.waitForTimeout(150);
      await shot(page, "shift-light-3b-next-pair");
      await page.getByRole("button", { name: "Page ready" }).click();
      await stage(page, "exit");
      await page.waitForTimeout(220);
      await shot(page, "shift-light-4-exit");
    }
    await ctx.close();
  }

  // Video: two cycles.
  const vctx = await browser.newContext({ ...base, recordVideo: { dir: OUT, size: { width: 360, height: 800 } } });
  const vp = await vctx.newPage();
  await vp.goto(`${BASE}/dev/loaders`, { waitUntil: "networkidle" });
  await vp.getByRole("button", { name: "Replay" }).click();
  await vp.waitForTimeout(3600);
  await vp.getByRole("button", { name: "Page ready" }).click();
  await vp.waitForTimeout(2200);
  const video = vp.video();
  await vctx.close();
  if (video) {
    const p = await video.path();
    renameSync(p, path.join(OUT, "shift-loader-loop.webm"));
    console.log("video saved");
  }

  // Reduced motion.
  const rctx = await browser.newContext({ ...base, reducedMotion: "reduce" });
  const rp = await rctx.newPage();
  await rp.goto(`${BASE}/dev/loaders`, { waitUntil: "networkidle" });
  await rp.getByRole("button", { name: "Replay" }).click();
  await rp.waitForSelector('[data-shift-loader="reduced"]');
  await rp.waitForTimeout(400);
  await shot(rp, "shift-reduced");
  await rctx.close();

  // Gallery: button loading, shimmer, typing bubble, context loaders.
  const gctx = await browser.newContext(base);
  const g = await gctx.newPage();
  g.setDefaultTimeout(30000);
  await g.goto(`${BASE}/dev/gallery`, { waitUntil: "networkidle" });
  const frames = g.locator("section").filter({ hasText: "Loaders" }).locator("figure");
  const n = await frames.count();
  console.log("loader frames", n);
  const names = ["gallery-shift-frame", "gallery-shift-reduced", "button-loading", "shimmer", "typing-and-context"];
  for (let i = 0; i < n && i < names.length; i++) {
    await frames.nth(i).scrollIntoViewIfNeeded();
    await g.waitForTimeout(i === 0 ? 1600 : 500);
    await frames.nth(i).screenshot({ path: path.join(OUT, `${names[i]}.png`) });
    console.log("shot", names[i]);
  }
  await gctx.close();
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
