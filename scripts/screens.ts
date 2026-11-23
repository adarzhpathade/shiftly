/**
 * UI1 visual check: drives the onboarding + auth flow at 360x800 (device emulated,
 * 2x) and saves screenshots. Needs a running app (BASE_URL, default http://localhost:3000).
 *
 *   pnpm exec tsx --env-file=.env scripts/screens.ts
 *
 * It registers a throw-away account through the UI and deletes it at the end.
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { chromium, type Page } from "@playwright/test";
import ws from "ws";
import { PrismaClient } from "../src/generated/prisma/client";

neonConfig.webSocketConstructor = ws;

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT =
  process.env.SCREENS_OUT ??
  "D:\\Video Creation\\remotion-tmp\\claude\\090905147524e1df\\c4c58dd5-bfc9-4785-b73c-80dbd4ee6059\\scratchpad\\ui2";
mkdirSync(OUT, { recursive: true });

const email = `ui1-shots-${Date.now()}@shiftly.test`;
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
  console.log(
    `shot ${file}${overflow > 0 ? `  !! horizontal overflow ${overflow}px` : ""}`,
  );
}

function expectPath(page: Page, expected: string) {
  const p = new URL(page.url()).pathname;
  if (p !== expected) throw new Error(`Expected ${expected} but on ${p}`);
  console.log(`ok   at ${expected}`);
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 360, height: 800 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  try {
    // First visit: protected page -> /welcome (no seen_intro cookie).
    await page.goto(`${BASE}/`);
    await page.waitForURL("**/welcome");
    expectPath(page, "/welcome");
    // Mid-animation frames prove the splash actually moves.
    await page.waitForTimeout(150);
    await shot(page, "splash-150ms");
    await page.waitForTimeout(250);
    await shot(page, "splash-400ms");
    await page.waitForTimeout(500);
    await shot(page, "splash-900ms");
    await page.waitForTimeout(1100);
    await shot(page, "splash-settled");

    // Auto-advance to the intro.
    await page
      .getByRole("button", { name: "Next", exact: true })
      .waitFor({ timeout: 5000 });
    await shot(page, "intro-1-150ms");
    await page.waitForTimeout(250);
    await shot(page, "intro-1-400ms");
    await page.waitForTimeout(500);
    await shot(page, "intro-1-900ms");
    await page.waitForTimeout(1200);
    await shot(page, "intro-1-learn");
    await page.getByRole("button", { name: "Let's go" }).click();
    await page.waitForURL(`${BASE}/`);
    await page.waitForTimeout(600);
    expectPath(page, "/");
    await page.getByRole("heading", { level: 1 }).waitFor();
    await page.waitForTimeout(1500);
    await shot(page, "home-top");
    await page.evaluate(() => window.scrollTo(0, 650));
    await page.waitForTimeout(500);
    await shot(page, "home-mid");
    await page.getByRole("checkbox", { checked: false }).first().click({ force: true });
    await page.waitForTimeout(250);
    await shot(page, "home-checkin-pop");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(600);
    await shot(page, "home-bottom");
    await page.getByRole("link", { name: "Training", exact: true }).click();
    await page.waitForURL("**/training");
    await page.waitForTimeout(600);
    await shot(page, "training-coming-soon");

    // /login while logged in -> /.
    await page.goto(`${BASE}/login`);
    await page.waitForURL(`${BASE}/`);
    console.log("ok   logged-in /login -> /");

    await page.goto(`${BASE}/profile`);
    await page.getByRole("button", { name: "Log out" }).click();
    await page.waitForURL("**/login**");
    expectPath(page, "/login");
  } finally {
    await browser.close();
  }
}

async function cleanup() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return;
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString }),
  });
  try {
    const res = await prisma.user.deleteMany({ where: { email } });
    console.log(`cleanup: deleted ${res.count} test user(s)`);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(cleanup);
