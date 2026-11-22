import type { ReactNode } from "react";
import { Sticker } from "@/components/ui/Sticker";

export interface ComingSoonProps {
  title: string;
  children?: ReactNode;
}

export function ComingSoon({ title, children }: ComingSoonProps) {
  return (
    <main className="mx-auto flex min-h-[70dvh] w-full max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
      <Sticker pose="wave" size={120} />
      <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
      <p className="text-ink-soft">Coming soon</p>
      {children}
    </main>
  );
}
