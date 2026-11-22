import type { ReactNode } from "react";
import { Wordmark } from "@/components/ui";

/** Cream page with a centred, max 440px column and the wordmark on top. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-cream">
      <div className="mx-auto flex min-h-dvh max-w-[440px] flex-col px-gutter pt-5 pb-8">
        <Wordmark sizeClass="text-[22px]" />
        {children}
      </div>
    </main>
  );
}
