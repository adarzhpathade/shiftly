import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { listTeamsForRegistration } from "@/server/auth/actions";
import { RegisterClient } from "./register-client";

export const metadata: Metadata = { title: "Create account" };

async function RegisterContent() {
  await connection();
  const teams = await listTeamsForRegistration();
  return <RegisterClient teams={teams} />;
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-cream" />}>
      <RegisterContent />
    </Suspense>
  );
}
