/**
 * UI6 visual check: leaderboard team/week, team/all, company/week, scrolled with pinned row,
 * at 360x800 @2x. Logs in with the demo employee. Needs a running app.
 *
 *   BASE_URL=http://localhost:3100 pnpm exec tsx scripts/screens-ui6.ts
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT =
  process.env.SCREENS_OUT ??
  "D:/Video Creation/remotion-tmp/claude/090905147524e1df/c4c58dd5-bfc9-4785-b73c-80dbd4ee6059/scratchpad/ui6";
mkdirSync(OUT, { recursive: true });
let n = 0;

async function shot(page: Page, name: string, fullPage = false) {
  n += 1;
  const file = path.join(OUT, `${String(n).padStart(2, "0")}-${name}.png`);
  await page.screenshot({ path: file, fullPage });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  console.log(`shot ${file}${overflow > 0 ? `  !! horizontal overflow ${overflow}px` : ""}`);
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 360, height: 800 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  try {
    await context.addCookies([{ name: "seen_intro", value: "1", url: BASE }]);
    await page.goto(`${BASE}/login`);
    await page.getByRole("button", { name: /Employee: Aarohi/ }).click();
    await page.getByRole("button", { name: "Log in" }).click();
    await page.waitForURL(`${BASE}/`);

    await page.goto(`${BASE}/leaderboard`);
    await page.getByRole("heading", { level: 1 }).waitFor();
    await page.waitForTimeout(1800);
    await shot(page, "team-week");

    await page.getByRole("button", { name: "All time" }).click();
    await page.waitForURL(/period=all/);
    await page.waitForTimeout(1800);
    await shot(page, "team-all");

    await page.getByRole("button", { name: "Company" }).click();
    await page.getByRole("button", { name: "This week" }).click();
    await page.waitForURL(/scope=company&period=week/);
    await page.waitForTimeout(1800);
    await shot(page, "company-week");
    await shot(page, "company-week-full", true);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(900);
    await shot(page, "company-week-scrolled-pinned");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
