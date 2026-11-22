"use client";

import { useEffect } from "react";

export default function TrainingError({
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
    <main className="mx-auto flex min-h-[70dvh] w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-2xl font-extrabold tracking-tight">Something went wrong</h2>
      <p className="text-sm text-ink-soft">Failed to load training. Please try again.</p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-pill bg-ink px-6 py-3 font-extrabold text-cream active:scale-95 transition-transform"
      >
        Try again
      </button>
    </main>
  );
}
