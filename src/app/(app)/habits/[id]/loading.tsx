export default function HabitDetailLoading() {
  return (
    <div aria-busy="true" aria-label="Loading habit" className="animate-pulse px-gutter pt-8">
      <div className="h-14 w-56 rounded-xl bg-ink/10" />
      <div className="mt-4 h-36 w-full rounded-card bg-ink/10" />
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="h-20 rounded-card bg-ink/10" />
        <div className="h-20 rounded-card bg-ink/10" />
      </div>
      <div className="mt-3 h-64 w-full rounded-card bg-ink/10" />
    </div>
  );
}
