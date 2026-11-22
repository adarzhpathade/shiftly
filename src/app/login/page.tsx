// Placeholder: replaced by UI1
import { LoginForm } from "./login-form";
import { Card } from "@/components/ui/Card";
import { BracketHeadline } from "@/components/ui/BracketHeadline";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream p-gutter">
      <Card tone="paper" padding="lg" className="w-full max-w-md">
        <BracketHeadline size="h2" highlightTone="lav-ink" className="mb-6">
          {"Sign in to [Shiftly]"}
        </BracketHeadline>
        <LoginForm />
      </Card>
    </main>
  );
}
