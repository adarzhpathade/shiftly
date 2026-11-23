import TrainingLoading from "./loading";
import { Suspense } from "react";
import { trainingRepo } from "@/data";
import { CategoryList } from "@/features/training";
import { requireViewer } from "@/server/auth/session";

async function TrainingContent() {
  const viewer = await requireViewer();
  const categories = await trainingRepo.listCategories(viewer.id);
  return <CategoryList categories={categories} />;
}

export default function TrainingPage() {
  return (
    <Suspense fallback={<TrainingLoading />}>
      <TrainingContent />
    </Suspense>
  );
}
