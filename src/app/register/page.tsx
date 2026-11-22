// Placeholder: replaced by UI1
import { Suspense } from "react";
import { connection } from "next/server";
import { listTeamsForRegistration } from "@/server/auth/actions";
import { RegisterForm } from "./register-form";
import { Card } from "@/components/ui/Card";
import { BracketHeadline } from "@/components/ui/BracketHeadline";

async function RegisterFormContainer() {
  await connection();
  const teams = await listTeamsForRegistration();
  return <RegisterForm teams={teams} />;
}

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream p-gutter">
      <Card tone="paper" padding="lg" className="w-full max-w-md">
        <BracketHeadline size="h2" highlightTone="lav-ink" className="mb-6">
          {"Join [Shiftly]"}
        </BracketHeadline>
        <Suspense
          fallback={
            <div className="py-8 text-center text-[14px] text-ink-soft">
              Loading...
            </div>
          }
        >
          <RegisterFormContainer />
        </Suspense>
      </Card>
    </main>
  );
}
