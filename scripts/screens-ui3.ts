/**
 * UI3 visual check: training list, level path, scenario player, feedback, result
 * at 360x800 @2x. Logs in with the demo employee. Needs a running app.
 *
 *   pnpm exec tsx scripts/screens-ui3.ts
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT =
  process.env.SCREENS_OUT ??
  "D:/Video Creation/remotion-tmp/claude/090905147524e1df/c4c58dd5-bfc9-4785-b73c-80dbd4ee6059/scratchpad/ui3";
mkdirSync(OUT, { recursive: true });
let n = 0;

async function shot(page: Page, name: string) {
  n += 1;
  const file = path.join(OUT, `${String(n).padStart(2, "0")}-${name}.png`);
  await page.screenshot({ path: file });
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
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

    await page.goto(`${BASE}/training`);
    await page.getByRole("heading", { level: 2 }).first().waitFor();
    await page.waitForTimeout(1500);
    await shot(page, "training-list");

    await page.locator("a[data-category]").first().click();
    await page.waitForURL("**/training/*");
    await page.getByRole("heading", { level: 1 }).waitFor();
    await page.waitForTimeout(1800);
    await shot(page, "level-path-top");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await shot(page, "level-path-bottom");

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator("li[data-state=current] a, li[data-state=unlocked] a").first().click();
    await page.waitForURL(/\/training\/[^/]+\/\d$/);
    await page.getByRole("button", { name: /^A/ }).waitFor();
    await page.waitForTimeout(1200);
    await shot(page, "player-question");

    await page.getByRole("button", { name: /^A/ }).click();
    await page.getByRole("button", { name: "Continue" }).or(page.getByRole("button", { name: "See result" })).waitFor();
    await page.waitForTimeout(900);
    await shot(page, "player-feedback");

    for (let i = 0; i < 10; i++) {
      const see = page.getByRole("button", { name: "See result" });
      if (await see.count()) {
        await see.click();
        break;
      }
      await page.getByRole("button", { name: "Continue" }).click();
      await page.getByRole("button", { name: /^B/ }).waitFor();
      await page.waitForTimeout(700);
      await page.getByRole("button", { name: /^B/ }).click();
      await page.waitForTimeout(700);
    }
    await page.getByText("Scenario complete").waitFor();
    await page.waitForTimeout(700);
    await shot(page, "result-mid");
    await page.waitForTimeout(2200);
    await shot(page, "result-settled");
    await page.evaluate(() => document.querySelector(".fixed")?.scrollTo(0, 2000));
    await page.waitForTimeout(400);
    await shot(page, "result-bottom");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
