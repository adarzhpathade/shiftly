import { Shimmer } from "@/components/ui";

export default function LeaderboardLoading() {
  return (
    <div role="status" aria-busy="true" className="px-gutter pt-8">
      <span className="sr-only">Loading leaderboard</span>
      <Shimmer tone="lav" className="h-3 w-24 rounded-pill" />
      <Shimmer tone="lav" className="mt-3 h-16 w-60 rounded-xl" />
      <Shimmer tone="lav" className="mt-5 h-12 w-full rounded-pill" />
      <Shimmer tone="paper" className="mt-2 h-10 w-full rounded-pill" />
      <div className="mt-6 flex items-end gap-2">
        <Shimmer tone="sky" className="h-44 flex-1 rounded-t-[20px]" />
        <Shimmer tone="lav" peek="cheer" className="h-56 flex-1 rounded-t-[20px]" />
        <Shimmer tone="peach" className="h-36 flex-1 rounded-t-[20px]" />
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <Shimmer tone="paper" className="h-[62px] w-full rounded-[18px]" />
        <Shimmer tone="paper" className="h-[62px] w-full rounded-[18px]" />
        <Shimmer tone="paper" className="h-[62px] w-full rounded-[18px]" />
      </div>
    </div>
  );
}
