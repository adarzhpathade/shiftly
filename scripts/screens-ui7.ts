/**
 * UI7/UI8 visual check at 360x800 @2x: profile, buddy sheet, badge sheet, all badges,
 * each celebration overlay, leaderboard. Needs `next dev` running (the /dev page).
 *
 *   BASE_URL=http://localhost:3107 pnpm exec tsx scripts/screens-ui7.ts
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3107";
const OUT =
  process.env.SCREENS_OUT ??
  "D:/Video Creation/remotion-tmp/claude/090905147524e1df/c4c58dd5-bfc9-4785-b73c-80dbd4ee6059/scratchpad/ui7";
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
  page.setDefaultTimeout(30000);
  try {
    await context.addCookies([{ name: "seen_intro", value: "1", url: BASE }]);
    await page.goto(`${BASE}/login`);
    await page.getByRole("button", { name: /Employee: Aarohi/ }).click();
    await page.getByRole("button", { name: "Log in" }).click();
    await page.waitForURL(`${BASE}/`);

    await page.goto(`${BASE}/profile`);
    await page.getByRole("heading", { level: 1 }).waitFor();
    await page.waitForTimeout(1800);
    await shot(page, "profile-top");
    await shot(page, "profile-full", true);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(700);
    await shot(page, "profile-bottom");
    await page.evaluate(() => window.scrollTo(0, 0));

    await page.getByRole("button", { name: "Change your buddy" }).click();
    await page.waitForTimeout(900);
    await shot(page, "buddy-sheet");
    await page.getByRole("radio", { name: /./ }).nth(2).click();
    await page.getByRole("button", { name: "Save buddy" }).click();
    await page.waitForTimeout(1500);
    await shot(page, "buddy-saved");

    await page.getByRole("button", { name: /earned$/ }).first().click();
    await page.waitForTimeout(900);
    await shot(page, "badge-sheet-earned");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: /locked$/ }).first().click();
    await page.waitForTimeout(900);
    await shot(page, "badge-sheet-locked");
    await page.keyboard.press("Escape");

    await page.goto(`${BASE}/profile/badges`);
    await page.getByRole("heading", { level: 1 }).waitFor();
    await page.waitForTimeout(1200);
    await shot(page, "badges-all");

    await page.goto(`${BASE}/dev/celebrations`);
    for (const label of ["Level up", "New badge", "Streak 7", "Quest complete"]) {
      await page.getByRole("button", { name: label, exact: true }).click();
      await page.waitForTimeout(2000);
      await shot(page, `celebrate-${label.toLowerCase().replace(/\s+/g, "-")}`);
      await page.getByRole("dialog").getByRole("button").click();
      await page.waitForTimeout(600);
    }

    await page.goto(`${BASE}/leaderboard`);
    await page.getByRole("heading", { level: 1 }).waitFor();
    await page.waitForTimeout(1800);
    await shot(page, "leaderboard");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(900);
    await shot(page, "leaderboard-bottom");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
