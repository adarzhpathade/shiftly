export default function HabitsLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading habits"
      className="animate-pulse px-gutter pt-8"
    >
      <div className="h-3 w-24 rounded-pill bg-ink/10" />
      <div className="mt-3 h-16 w-64 rounded-xl bg-ink/10" />
      <div className="mt-5 h-28 w-full rounded-card bg-ink/10" />
      <div className="mt-5 flex flex-col gap-2">
        <div className="h-[68px] w-full rounded-[18px] bg-ink/10" />
        <div className="h-[68px] w-full rounded-[18px] bg-ink/10" />
        <div className="h-[68px] w-full rounded-[18px] bg-ink/10" />
      </div>
    </div>
  );
}
