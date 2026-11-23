/**
 * Auth + habits visual check at 360x800 @2x. Needs `next dev -p 3108` running.
 *   pnpm exec tsx --env-file=.env scripts/screens-auth-habits.ts [phase]
 * phases: auth (login, register, forgot password), habits (habits, detail, home), new (new-user habits)
 * Run `new` against a server started with MOCK_HABITS_VARIANT=new.
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { chromium, type Browser, type BrowserContext, type Page } from "@playwright/test";
import ws from "ws";
import { PrismaClient } from "../src/generated/prisma/client";

neonConfig.webSocketConstructor = ws;

const BASE = process.env.BASE_URL ?? "http://localhost:3108";
const OUT =
  process.env.SCREENS_OUT ??
  "D:/Video Creation/remotion-tmp/claude/090905147524e1df/b8526b5c-1e8e-49a7-9685-335515e6525b/scratchpad/screens-auth-habits";
mkdirSync(OUT, { recursive: true });
const UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";

async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  console.log(`shot ${name}${overflow > 0 ? `  !! horizontal overflow ${overflow}px` : ""}`);
}
async function full(page: Page, name: string) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  console.log(`full ${name}`);
}

function ctx(browser: Browser, scheme: "light" | "dark" = "light"): Promise<BrowserContext> {
  return browser.newContext({
    viewport: { width: 360, height: 800 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: UA,
    colorScheme: scheme,
  });
}

async function login(page: Page, email = "aarohi@shiftly.demo", password = "demo1234") {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.locator("input[name=email]").fill(email);
  await page.locator("input[name=password]").fill(password);
  await page.getByRole("button", { name: "Clock in" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 30000 });
}

async function auth(browser: Browser) {
  for (const scheme of ["light", "dark"] as const) {
    const c = await ctx(browser, scheme);
    const page = await c.newPage();
    page.setDefaultTimeout(30000);
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1400);
    await shot(page, `login-${scheme === "light" ? "1-idle" : "dark"}`);
    if (scheme === "light") {
      await page.locator("input[name=email]").fill("aarohi@shiftly.demo");
      await page.locator("input[name=password]").focus();
      await page.keyboard.type("demo1234");
      await page.waitForTimeout(700);
      await shot(page, "login-2-password-focused");
      await page.getByRole("button", { name: "Clock in" }).click();
      await page.waitForSelector("[data-pose=thumbs]");
      await page.waitForTimeout(500);
      await shot(page, "login-3-success-thumbs");
      await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 30000 });
      await c.clearCookies();
      await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
      await page.locator("input[name=email]").fill("aarohi@shiftly.demo");
      await page.locator("input[name=password]").fill("wrong-password");
      await page.getByRole("button", { name: "Clock in" }).click();
      await page.waitForTimeout(1100);
      await shot(page, "login-4-wrong-shrug");
    }
    await c.close();
  }

  // Register: real throw-away account, deleted at the end.
  const email = `auth-shots-${Date.now()}@shiftly.test`;
  const c = await ctx(browser);
  const page = await c.newPage();
  page.setDefaultTimeout(30000);
  await page.goto(`${BASE}/register`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await page.locator("input[name=name]").fill("Aarohi Joshi");
  await page.waitForTimeout(300);
  await shot(page, "register-1-name");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.waitForTimeout(500);
  await page.locator("input[name=email]").fill(email);
  await page.getByRole("radio").first().click();
  await page.waitForTimeout(500);
  await shot(page, "register-2-team");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.waitForTimeout(500);
  await page.locator("input[name=password]").fill("demo1234");
  await page.waitForTimeout(900);
  await shot(page, "register-3-password");
  await page.locator("input[name=password]").fill("Demo-1234-xyz");
  await page.getByRole("button", { name: "Join the team" }).click();
  await page.waitForSelector("[aria-label=Hired]");
  await page.waitForTimeout(700);
  await shot(page, "register-4-hired");
  await page.waitForTimeout(1400);
  await shot(page, "register-5-handoff");
  await page.waitForURL((u) => u.pathname.startsWith("/setup"), { timeout: 30000 }).catch(() => undefined);
  await c.close();
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL ?? "" }) });
  try {
    const res = await prisma.user.deleteMany({ where: { email } });
    console.log(`cleanup: deleted ${res.count} test user(s)`);
  } finally {
    await prisma.$disconnect();
  }

  // Forgot password.
  const f = await ctx(browser);
  const fp = await f.newPage();
  fp.setDefaultTimeout(30000);
  await fp.goto(`${BASE}/forgot-password`, { waitUntil: "networkidle" });
  await fp.waitForTimeout(900);
  await shot(fp, "forgot-1-email");
  await fp.locator("input[name=email]").fill("aarohi@shiftly.demo");
  await fp.getByRole("button", { name: "Send code" }).click();
  await fp.waitForTimeout(250);
  await shot(fp, "forgot-1b-sending-mailbox");
  await fp.getByText("Check your").waitFor();
  await fp.waitForTimeout(900);
  await shot(fp, "forgot-2-code");
  await fp.getByRole("textbox", { name: "Digit 1 of 6" }).click();
  await fp.keyboard.type("123456");
  await fp.locator("input[name=newPassword]").fill("Brand-new-pass1");
  await fp.waitForTimeout(700);
  await shot(fp, "forgot-3-filled");
  await fp.getByRole("button", { name: "Reset password" }).click();
  await fp.waitForTimeout(1500);
  await shot(fp, "forgot-4-error");
  // Success: server action stubbed when the real action rejects every code (see report).
  await fp.route("**/forgot-password", async (route) => {
    const req = route.request();
    if (req.method() === "POST" && req.headers()["next-action"]) {
      await route.fulfill({
        status: 200,
        contentType: "text/x-component",
        body: `0:{"a":"$@1","f":"","b":"development"}\n1:{"ok":true}\n`,
      });
      return;
    }
    await route.continue();
  });
  await fp.getByRole("button", { name: "Reset password" }).click();
  await fp.waitForTimeout(1300);
  await shot(fp, "forgot-5-success");
  await f.close();
}

async function habits(browser: Browser, tag: string) {
  const c = await ctx(browser);
  const page = await c.newPage();
  page.setDefaultTimeout(30000);
  await login(page);
  await page.goto(`${BASE}/habits`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1400);
  await shot(page, `habits-${tag}-1-top`);
  await full(page, `habits-${tag}-full`);
  if (tag === "demo") {
    await page.goto(`${BASE}/habits/clocks-in`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1400);
    await shot(page, "habit-detail-1-top");
    await full(page, "habit-detail-full");
    await page.goto(`${BASE}/habits/trains`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    await full(page, "habit-detail-slipping-full");
    await page.goto(`${BASE}/habits`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /faded/ }).click();
    await page.waitForTimeout(400);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await shot(page, "habits-demo-2-bottom-faded");
  }
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await full(page, `home-${tag}-full`);
  const strip = page.getByRole("region", { name: "Your habits" });
  await strip.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await shot(page, `home-${tag}-habits-strip`);
  await c.close();
  if (tag === "demo") {
    const d = await ctx(browser, "dark");
    const dp = await d.newPage();
    dp.setDefaultTimeout(30000);
    await login(dp);
    await dp.goto(`${BASE}/habits`, { waitUntil: "networkidle" });
    await dp.waitForTimeout(1400);
    await shot(dp, "habits-dark");
    await d.close();
  }
}

async function main() {
  const phase = process.argv[2] ?? "all";
  const browser = await chromium.launch();
  if (phase === "all" || phase === "auth") await auth(browser);
  if (phase === "all" || phase === "habits") await habits(browser, "demo");
  if (phase === "new") await habits(browser, "new");
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
