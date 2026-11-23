import { Shimmer } from "@/components/ui";

export default function HabitDetailLoading() {
  return (
    <div role="status" aria-busy="true" className="px-gutter pt-8">
      <span className="sr-only">Loading habit</span>
      <Shimmer tone="peach" className="h-14 w-56 rounded-xl" />
      <Shimmer tone="lime" peek="wave" className="mt-4 h-36 w-full rounded-card" />
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Shimmer tone="sky" className="h-20 rounded-card" />
        <Shimmer tone="peach" className="h-20 rounded-card" />
      </div>
      <Shimmer tone="paper" className="mt-3 h-64 w-full rounded-card" />
    </div>
  );
}
