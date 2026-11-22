import type { Metadata } from "next";
import { Suspense } from "react";
import type { DemoAccount } from "@/features/auth";
import { LoginClient } from "./login-client";

export const metadata: Metadata = { title: "Log in" };

/** Documented demo accounts (prisma/README.md). Only offered when NEXT_PUBLIC_DEMO_MODE=1. */
const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { label: "Employee: Aarohi", email: "aarohi@shiftly.demo", password: "demo1234" },
  { label: "Admin: Aditya", email: "admin@shiftly.demo", password: "demo1234" },
];

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const { callbackUrl } = await searchParams;
  const raw = Array.isArray(callbackUrl) ? callbackUrl[0] : callbackUrl;
  // Only same-site paths: never bounce to another origin.
  const safe = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  const demo = process.env.NEXT_PUBLIC_DEMO_MODE === "1";
  return <LoginClient callbackUrl={safe} demoAccounts={demo ? DEMO_ACCOUNTS : undefined} />;
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-cream" />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}
