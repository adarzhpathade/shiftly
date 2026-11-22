export default function LeaderboardLoading() {
  return (
    <div aria-busy="true" aria-label="Loading leaderboard" className="animate-pulse px-gutter pt-8">
      <div className="h-3 w-24 rounded-pill bg-ink/10" />
      <div className="mt-3 h-16 w-60 rounded-xl bg-ink/10" />
      <div className="mt-5 h-12 w-full rounded-pill bg-ink/10" />
      <div className="mt-2 h-10 w-full rounded-pill bg-ink/10" />
      <div className="mt-6 flex items-end gap-2">
        <div className="h-44 flex-1 rounded-t-[20px] bg-ink/10" />
        <div className="h-56 flex-1 rounded-t-[20px] bg-ink/10" />
        <div className="h-36 flex-1 rounded-t-[20px] bg-ink/10" />
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <div className="h-[62px] w-full rounded-[18px] bg-ink/10" />
        <div className="h-[62px] w-full rounded-[18px] bg-ink/10" />
        <div className="h-[62px] w-full rounded-[18px] bg-ink/10" />
      </div>
    </div>
  );
}
