export default function Loading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      className="mx-auto w-full max-w-md animate-pulse space-y-4 px-4 pt-5"
    >
      <div className="flex items-center gap-3">
        <div className="size-12 rounded-full bg-ink/10" />
        <div className="h-8 w-40 rounded-xl bg-ink/10" />
      </div>
      <div className="h-3 w-full rounded-pill bg-ink/10" />
      <div className="h-44 w-full rounded-card bg-ink/10" />
      <div className="h-16 w-full rounded-card bg-ink/10" />
      <div className="h-16 w-full rounded-card bg-ink/10" />
      <div className="h-40 w-full rounded-card bg-ink/10" />
    </div>
  );
}
