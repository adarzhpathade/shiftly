import { Shimmer } from "@/components/ui";

export default function HabitFormLoading() {
  return (
    <div role="status" aria-busy="true" className="px-gutter pt-8">
      <span className="sr-only">Loading</span>
      <Shimmer tone="lime" className="h-3 w-24 rounded-pill" />
      <Shimmer tone="lime" className="mt-3 h-16 w-64 rounded-xl" />
      <Shimmer tone="paper" peek="think" className="mt-5 h-14 w-full rounded-[18px]" />
      <Shimmer tone="paper" className="mt-3 h-28 w-full rounded-card" />
      <Shimmer tone="lime" className="mt-5 h-14 w-full rounded-pill" />
    </div>
  );
}
