export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-gutter text-center">
      <h1 className="text-5xl leading-[0.9] font-extrabold tracking-[-0.04em]">
        shiftly is <span className="text-lav-ink">[loading]</span>
      </h1>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="rounded-pill bg-lime px-4 py-2 text-sm font-bold text-ink">
          Small habits, big wins
        </span>
        <button
          type="button"
          className="min-h-12 rounded-pill bg-ink px-6 font-bold text-cream transition-transform duration-300 ease-spring active:scale-95"
        >
          Get started
        </button>
      </div>
    </main>
  );
}
