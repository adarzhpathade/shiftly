import HabitDetailLoading from "./loading";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { habitRepo } from "@/data";
import { HabitDetailScreen } from "@/features/habits";
import { requireViewer } from "@/server/auth/session";
import type { HabitDetail } from "@/lib/types";

interface PageProps {
  params: Promise<{ key: string }>;
}

async function DetailContent({ params }: PageProps) {
  const { key } = await params;
  const viewer = await requireViewer();
  let habit: HabitDetail;
  try {
    habit = await habitRepo.getDetail(viewer.id, decodeURIComponent(key));
  } catch {
    notFound();
  }
  return <HabitDetailScreen habit={habit} />;
}

export default function HabitDetailPage({ params }: PageProps) {
  return (
    <Suspense fallback={<HabitDetailLoading />}>
      <DetailContent params={params} />
    </Suspense>
  );
}
