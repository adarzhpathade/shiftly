import Link from "next/link";
import { notFound } from "next/navigation";
import { isCategoryKey } from "@/server/training/types";

interface BossPageProps {
  params: Promise<{ category: string }>;
}

export default async function BossPage({ params }: BossPageProps) {
  const { category: rawCategory } = await params;
  if (!isCategoryKey(rawCategory)) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-[70dvh] w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-extrabold tracking-tight">Boss level</h1>
      <p className="text-ink-soft">Coming soon</p>
      <Link
        href={`/training/${rawCategory}`}
        className="rounded-pill bg-ink px-6 py-3 font-extrabold text-cream active:scale-95 transition-transform"
      >
        Back to levels
      </Link>
    </main>
  );
}
