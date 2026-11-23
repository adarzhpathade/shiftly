import { Shimmer } from "@/components/ui";

export default function TrainingLoading() {
  return (
    <div role="status" aria-busy="true" className="px-gutter pt-8">
      <span className="sr-only">Loading training</span>
      <Shimmer tone="lav" className="h-3 w-24 rounded-pill" />
      <Shimmer tone="lav" className="mt-3 h-16 w-64 rounded-xl" />
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Shimmer tone="lav" peek="think" className="h-40 rounded-card" />
        <Shimmer tone="lime" className="h-40 rounded-card" />
        <Shimmer tone="peach" className="h-40 rounded-card" />
        <Shimmer tone="sky" className="h-40 rounded-card" />
      </div>
    </div>
  );
}
