import { Suspense } from "react";
import { notFound } from "next/navigation";
import { trainingRepo } from "@/data";
import { LevelPath } from "@/features/training";
import { requireViewer } from "@/server/auth/session";
import { isCategoryKey } from "@/server/training/types";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

async function CategoryContent({ params }: CategoryPageProps) {
  const { category: rawCategory } = await params;
  if (!isCategoryKey(rawCategory)) {
    notFound();
  }

  const viewer = await requireViewer();
  const [categories, levels] = await Promise.all([
    trainingRepo.listCategories(viewer.id),
    trainingRepo.getLevelPath(viewer.id, rawCategory),
  ]);

  const category = categories.find((c) => c.key === rawCategory);
  if (!category) {
    notFound();
  }

  return <LevelPath category={category} levels={levels} />;
}

export default function CategoryPage({ params }: CategoryPageProps) {
  return (
    <Suspense fallback={<div aria-busy="true" className="min-h-dvh bg-cream" />}>
      <CategoryContent params={params} />
    </Suspense>
  );
}
