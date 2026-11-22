/**
 * UI10 visual check: boss intro, locked, chat (typing, mid-conversation, fallback), won, lost,
 * at 360x800 @2x. Logs in with the demo employee. Run the app with AI_MODE=mock for stable shots.
 *
 *   BASE_URL=http://localhost:3100 pnpm exec tsx scripts/screens-ui10.ts
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT =
  process.env.SCREENS_OUT ??
  "D:/Video Creation/remotion-tmp/claude/090905147524e1df/c4c58dd5-bfc9-4785-b73c-80dbd4ee6059/scratchpad/ui10";
mkdirSync(OUT, { recursive: true });
let n = 0;

const CATEGORIES = ["handling-complaints", "customer-queries", "difficult-customers", "problem-solving"];
const GOOD = "I am really sorry about this. I will personally raise your refund today, and I will call you back by 5 pm with a reference number.";
const RUDE = "Calm down, whatever, it is not my fault.";

async function shot(page: Page, name: string, fullPage = false) {
  n += 1;
  const file = path.join(OUT, `${String(n).padStart(2, "0")}-${name}.png`);
  await page.screenshot({ path: file, fullPage });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  console.log(`shot ${file}${overflow > 0 ? `  !! horizontal overflow ${overflow}px` : ""}`);
}

async function scrollEnd(page: Page) {
  await page.evaluate(() => {
    document.querySelectorAll<HTMLElement>(".overflow-y-auto").forEach((el) => el.scrollTo(0, el.scrollHeight));
  });
  await page.waitForTimeout(400);
}

async function reply(page: Page, text: string) {
  const box = page.getByLabel("Your reply");
  await box.fill(text);
  await page.getByRole("button", { name: "Send reply" }).click();
}

async function playUntilEnd(page: Page, text: string) {
  for (let i = 0; i < 9; i++) {
    if (await page.getByRole("button", { name: "See result" }).isVisible().catch(() => false)) return;
    await reply(page, text);
    await page.getByRole("button", { name: "Send reply" }).waitFor({ state: "visible" }).catch(() => undefined);
    await page.waitForFunction(
      () => !document.querySelector('[aria-label="Customer is typing"]') && !(document.querySelector("textarea") as HTMLTextAreaElement | null)?.disabled,
      undefined,
      { timeout: 20000 },
    ).catch(() => undefined);
    await page.waitForTimeout(300);
  }
}

/** Plays levels 1-4 of a category through the UI (first choice each step) to unlock the boss in mock mode. */
async function unlockBoss(page: Page, category: string) {
  for (let level = 1; level <= 4; level++) {
    await page.goto(`${BASE}/training/${category}/${level}`);
    for (let i = 0; i < 12; i++) {
      const choice = page.locator("main ul li button, ul li button").first();
      const cont = page.getByRole("button", { name: /^(Continue|See result)$/ });
      if (await page.getByText(/Scenario complete/).isVisible().catch(() => false)) break;
      if (await cont.isVisible().catch(() => false)) await cont.click({ force: true, timeout: 3000 }).catch(() => undefined);
      else if (await choice.isVisible().catch(() => false)) await choice.click({ force: true, timeout: 3000 }).catch(() => undefined);
      await page.waitForTimeout(500);
    }
  }
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

    let open: string | null = null;
    let locked: string | null = null;
    for (const c of CATEGORIES) {
      await page.goto(`${BASE}/training/${c}/boss`);
      await page.getByRole("heading", { level: 1 }).waitFor();
      const isLocked = await page.getByText("Boss is locked").isVisible();
      if (isLocked && !locked) {
        locked = c;
        await page.waitForTimeout(900);
        await shot(page, "locked");
      }
      if (!isLocked && !open) open = c;
    }
    console.log(`open=${open} locked=${locked}`);
    if (!open) {
      open = "customer-queries";
      await unlockBoss(page, open);
    }

    const start = async () => {
      await page.goto(`${BASE}/training/${open}/boss`);
      await page.getByRole("button", { name: "Start call" }).waitFor();
      await page.waitForTimeout(900);
    };

    await start();
    await shot(page, "intro");
    await page.getByRole("button", { name: "Start call" }).click();
    await page.getByLabel("Your reply").waitFor();
    await page.waitForTimeout(700);
    await shot(page, "chat-start");

    await reply(page, GOOD);
    await page.getByLabel("Customer is typing").waitFor({ timeout: 4000 }).catch(() => undefined);
    await shot(page, "chat-typing");
    await page.waitForFunction(() => !(document.querySelector("textarea") as HTMLTextAreaElement | null)?.disabled, undefined, { timeout: 20000 });
    await page.waitForTimeout(600);
    await shot(page, "chat-mid");

    await reply(page, "/fail");
    await page.getByText("AI is busy right now").waitFor();
    await page.waitForTimeout(500);
    await shot(page, "chat-fallback");

    await start();
    await page.getByRole("button", { name: "Start call" }).click();
    await page.getByLabel("Your reply").waitFor();
    await playUntilEnd(page, GOOD);
    await page.getByRole("button", { name: "See result" }).waitFor();
    await shot(page, "chat-ended");
    await page.getByRole("button", { name: "See result" }).click();
    await page.getByLabel("Boss result", { exact: false }).first().waitFor().catch(() => undefined);
    await page.waitForTimeout(2200);
    await shot(page, "result-top");
    await scrollEnd(page);
    await shot(page, "result-bottom");

    await start();
    await page.getByRole("button", { name: "Start call" }).click();
    await page.getByLabel("Your reply").waitFor();
    await playUntilEnd(page, RUDE);
    await page.getByRole("button", { name: "See result" }).click();
    await page.waitForTimeout(2200);
    await shot(page, "result-lost");
    await scrollEnd(page);
    await shot(page, "result-lost-bottom");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
