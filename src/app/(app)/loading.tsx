import { Shimmer, ShiftLoading } from "@/components/ui";

/**
 * Home and any (app) route without its own loading file. The quick shimmer is always
 * there; the full "Shift Change" sweep joins it on the first load of the app, and later
 * only when something is slow (1.2 s), so tab taps never trigger a full-screen animation.
 */
export default function Loading() {
  return (
    <div role="status" aria-busy="true" className="mx-auto w-full max-w-md space-y-4 px-4 pt-5">
      <span className="sr-only">Loading</span>
      <ShiftLoading firstEntryOnly />
      <div className="flex items-center gap-3">
        <Shimmer tone="lime" className="size-12 rounded-full" />
        <Shimmer tone="lime" className="h-8 w-40 rounded-xl" />
      </div>
      <Shimmer tone="lime" className="h-3 w-full rounded-pill" />
      <Shimmer tone="lime" peek="wave" className="h-44 w-full rounded-card" />
      <Shimmer tone="paper" className="h-16 w-full rounded-card" />
      <Shimmer tone="paper" className="h-16 w-full rounded-card" />
      <Shimmer tone="lav" className="h-40 w-full rounded-card" />
    </div>
  );
}
