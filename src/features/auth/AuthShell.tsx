import type { ReactNode } from "react";
import { Rise, Stagger, Wordmark, ThemeColor } from "@/components/ui";

/** Cream page with a centred, max 440px column, the wordmark on top and a staggered entrance. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-cream">
      <ThemeColor color="cream" />
      <Stagger
        className="mx-auto flex min-h-dvh max-w-[440px] flex-col px-gutter pt-5 pb-8"
        gap={0.07}
      >
        <Rise className="flex justify-center">
          <Wordmark sizeClass="text-[22px]" />
        </Rise>
        {children}
      </Stagger>
    </main>
  );
}
