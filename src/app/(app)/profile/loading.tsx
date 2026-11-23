import { Shimmer } from "@/components/ui";

export default function ProfileLoading() {
  return (
    <div role="status" aria-busy="true" className="px-gutter pt-8">
      <span className="sr-only">Loading profile</span>
      <Shimmer tone="lav" peek="headset" className="h-72 w-full rounded-[28px]" />
      <div className="mt-3 flex gap-2">
        <Shimmer tone="paper" className="h-16 flex-1 rounded-[18px]" />
        <Shimmer tone="paper" className="h-16 flex-1 rounded-[18px]" />
        <Shimmer tone="paper" className="h-16 flex-1 rounded-[18px]" />
        <Shimmer tone="paper" className="h-16 flex-1 rounded-[18px]" />
      </div>
      <Shimmer tone="lav" className="mt-7 h-6 w-40 rounded-pill" />
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Shimmer tone="peach" className="h-28 rounded-[18px]" />
        <Shimmer tone="sky" className="h-28 rounded-[18px]" />
        <Shimmer tone="lime" className="h-28 rounded-[18px]" />
      </div>
    </div>
  );
}
