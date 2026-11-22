"use client";

import { useEffect } from "react";

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70dvh] w-full max-w-md flex-col items-center justify-center gap-4 px-gutter text-center">
      <h2 className="text-2xl font-extrabold tracking-tight">Something went wrong</h2>
      <p className="text-sm text-ink-soft">Failed to load your profile. Please try again.</p>
      <button
        type="button"
        onClick={() => reset()}
        className="min-h-12 rounded-pill bg-ink px-6 font-extrabold text-cream transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink"
      >
        Try again
      </button>
    </main>
  );
}
