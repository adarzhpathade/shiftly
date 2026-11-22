/**
 * UI5 visual check: habits list, check-in, new (template, custom, error), detail,
 * edit, delete sheet at 360x800 @2x. Logs in with the demo employee. Needs a running app.
 *
 *   BASE_URL=http://localhost:3100 pnpm exec tsx scripts/screens-ui5.ts
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT =
  process.env.SCREENS_OUT ??
  "D:/Video Creation/remotion-tmp/claude/090905147524e1df/c4c58dd5-bfc9-4785-b73c-80dbd4ee6059/scratchpad/ui5";
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

    await page.goto(`${BASE}/habits`);
    await page.getByRole("heading", { level: 1 }).waitFor();
    await page.waitForTimeout(1600);
    if ((await page.getByRole("checkbox").count()) === 0) {
      await shot(page, "list-empty");
      for (const t of ["Punctuality", "Teamwork", "Daily Learning"]) {
        await page.goto(`${BASE}/habits/new`);
        await page.getByRole("button", { name: new RegExp(t) }).click();
        await page.getByRole("button", { name: "Create habit" }).click();
        await page.waitForURL(/\/habits\/[^/]+$/);
      }
      await page.goto(`${BASE}/habits`);
      await page.getByRole("checkbox").first().waitFor();
      await page.waitForTimeout(1600);
    }
    await shot(page, "list");

    const box = page.getByRole("checkbox", { name: /^Check in:/ }).and(page.locator(":not(:checked)")).first();
    if (await box.count()) {
      await box.check({ force: true });
      await page.waitForTimeout(450);
      await shot(page, "list-checkin-pop");
      await page.waitForTimeout(1800);
      await shot(page, "list-checked");
    }

    await page.goto(`${BASE}/habits/new`);
    await page.getByRole("heading", { level: 1 }).waitFor();
    await page.waitForTimeout(1500);
    await shot(page, "new-top");
    await page.getByRole("button", { name: /Teamwork/ }).click();
    await page.waitForTimeout(900);
    await shot(page, "new-template-picked");

    await page.goto(`${BASE}/habits/new`);
    await page.getByLabel("Habit name").fill("Greet every customer");
    await page.getByRole("button", { name: "Focus" }).click();
    await page.getByRole("button", { name: "Saturday" }).click();
    await page.getByRole("button", { name: "Sunday" }).click();
    await page.getByLabel(/Reminder/).fill("08:30");
    await page.getByLabel("Habit name").scrollIntoViewIfNeeded();
    await shot(page, "new-custom-filled", true);

    await page.goto(`${BASE}/habits/new`);
    await page.getByLabel("Habit name").waitFor();
    for (const d of ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]) {
      await page.getByRole("button", { name: d }).click();
    }
    await page.getByRole("button", { name: "Create habit" }).click();
    await page.getByRole("alert").first().waitFor();
    await page.waitForTimeout(600);
    await shot(page, "new-errors", true);

    await page.goto(`${BASE}/habits`);
    await page.locator("main ul a[href^='/habits/']").first().click();
    await page.waitForURL(/\/habits\/[^/]+$/);
    await page.getByRole("heading", { level: 1 }).waitFor();
    await page.waitForTimeout(1800);
    const detailUrl = page.url();
    await shot(page, "detail-top");
    await shot(page, "detail-full", true);

    await page.goto(`${detailUrl}/edit`);
    await page.getByLabel("Habit name").waitFor();
    await page.waitForTimeout(1200);
    await shot(page, "edit", true);

    await page.goto(detailUrl);
    await page.getByRole("button", { name: "Delete habit" }).click();
    await page.getByRole("dialog").waitFor();
    await page.waitForTimeout(700);
    await shot(page, "delete-sheet");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
