import { Shimmer } from "@/components/ui";

export default function HabitsLoading() {
  return (
    <div role="status" aria-busy="true" className="px-gutter pt-8">
      <span className="sr-only">Loading habits</span>
      <Shimmer tone="lime" className="h-3 w-24 rounded-pill" />
      <Shimmer tone="lime" className="mt-3 h-16 w-64 rounded-xl" />
      <Shimmer tone="lav" peek="cheer" className="mt-5 h-28 w-full rounded-card" />
      <div className="mt-5 flex flex-col gap-2">
        <Shimmer tone="paper" className="h-[68px] w-full rounded-[18px]" />
        <Shimmer tone="paper" className="h-[68px] w-full rounded-[18px]" />
        <Shimmer tone="paper" className="h-[68px] w-full rounded-[18px]" />
      </div>
    </div>
  );
}
