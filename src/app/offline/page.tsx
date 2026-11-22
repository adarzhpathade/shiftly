import type { Metadata } from "next";
import { BracketHeadline, Sticker } from "@/components/ui";
import { RetryButton } from "./RetryButton";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false },
};

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 px-gutter py-12 text-center">
      <Sticker pose="wave" size={140} className="animate-float" />
      <BracketHeadline size="h1">{"You're [offline]"}</BracketHeadline>
      <p className="text-[15px] text-ink-soft">
        No signal right now. Your streak is safe. Reconnect and pick up where
        you left off.
      </p>
      <RetryButton />
    </main>
  );
}
