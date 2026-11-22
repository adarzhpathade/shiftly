export default function ProfileLoading() {
  return (
    <div aria-busy="true" aria-label="Loading profile" className="animate-pulse px-gutter pt-8">
      <div className="h-72 w-full rounded-[28px] bg-ink/10" />
      <div className="mt-3 flex gap-2">
        <div className="h-16 flex-1 rounded-[18px] bg-ink/10" />
        <div className="h-16 flex-1 rounded-[18px] bg-ink/10" />
        <div className="h-16 flex-1 rounded-[18px] bg-ink/10" />
        <div className="h-16 flex-1 rounded-[18px] bg-ink/10" />
      </div>
      <div className="mt-7 h-6 w-40 rounded-pill bg-ink/10" />
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="h-28 rounded-[18px] bg-ink/10" />
        <div className="h-28 rounded-[18px] bg-ink/10" />
        <div className="h-28 rounded-[18px] bg-ink/10" />
      </div>
    </div>
  );
}
