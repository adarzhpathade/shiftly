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
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.waitForTimeout(300);
    await shot(page, "intro-2-mid-transition");
    await page.waitForTimeout(1500);
    await shot(page, "intro-2-build");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.waitForTimeout(1800);
    await shot(page, "intro-3-level-up");
    await page.getByRole("button", { name: "Get started" }).click();
    await page.waitForURL("**/login");
    expectPath(page, "/login");
    await page.waitForTimeout(1400);
    await shot(page, "login-empty");

    // Intro is not shown again (unless NEXT_PUBLIC_INTRO_ALWAYS=1): a protected page now goes to /login.
    const always = process.env.NEXT_PUBLIC_INTRO_ALWAYS === "1";
    await page.goto(`${BASE}/`);
    await page.waitForURL(always ? "**/welcome" : "**/login**");
    if (always) {
      console.log("ok   intro-always: unauth / -> /welcome");
      await page.goto(`${BASE}/login`);
    }
    console.log(
      `ok   unauth / -> ${new URL(page.url()).pathname}${new URL(page.url()).search}`,
    );

    // Login with a wrong password.
    await page.getByLabel("Email", { exact: true }).fill("aarohi@shiftly.demo");
    await page.getByLabel("Password", { exact: true }).fill("not-the-password");
    await page.getByRole("button", { name: "Log in" }).click();
    await page.locator("p[role=alert]").waitFor();
    await shot(page, "login-error");

    // Demo helper fills the form.
    const demo = page.getByRole("button", { name: /Employee: Aarohi/ });
    if (await demo.count()) {
      await demo.click();
      await shot(page, "login-demo-filled");
    }

    // Register with field errors.
    await page.goto(`${BASE}/register`);
    await page.getByLabel("Name", { exact: true }).fill("A");
    await page.getByLabel("Email", { exact: true }).fill("not-an-email");
    await page.getByLabel("Password", { exact: true }).fill("abc");
    await shot(page, "register-filled-weak");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.locator("p[role=alert]").first().waitFor();
    await page.waitForTimeout(300);
    await shot(page, "register-errors");

    // Register for real.
    await page.getByLabel("Name", { exact: true }).fill("Test Buddy");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill("shots-pass-1234");
    await page.getByRole("radio").first().click();
    await shot(page, "register-valid");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL("**/setup");
    expectPath(page, "/setup");
    await page.getByRole("radiogroup").waitFor();
    await page.waitForTimeout(500);
    await shot(page, "setup-1-buddy");

    // Visiting / before onboarding bounces to /setup.
    await page.goto(`${BASE}/`);
    await page.waitForURL("**/setup");
    console.log("ok   / -> /setup while not onboarded");

    await page.getByRole("radio", { name: "Cappy" }).click();
    await page.waitForTimeout(400);
    await shot(page, "setup-1-buddy-picked");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.waitForTimeout(300);
    await shot(page, "setup-2-habits-empty");
    const cards = page
      .getByRole("button", { pressed: false })
      .filter({ hasText: /\w/ });
    const names = [
      "Punctuality",
      "Effective Communication",
      "Customer Follow-up",
    ];
    for (const n2 of names.slice(0, 2)) {
      await page.getByRole("button", { name: new RegExp(n2) }).click();
    }
    void cards;
    await page.waitForTimeout(300);
    await shot(page, "setup-2-habits-two");
    await page
      .getByRole("button", { name: names[2]! })
      .click()
      .catch(() => {});
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
