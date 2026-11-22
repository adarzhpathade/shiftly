import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { trainingRepo } from "@/data";
import { ScenarioPlayer } from "@/features/training";
import { requireViewer } from "@/server/auth/session";
import {
  answerStepAction,
  finishAttemptAction,
  startAttemptAction,
} from "@/server/training/actions";
import { isCategoryKey } from "@/server/training/types";

interface ScenarioPageProps {
  params: Promise<{ category: string; level: string }>;
}

async function ScenarioContent({ params }: ScenarioPageProps) {
  const { category: rawCategory, level: rawLevel } = await params;
  if (!isCategoryKey(rawCategory)) {
    notFound();
  }

  const levelNum = Number(rawLevel);
  if (!Number.isInteger(levelNum) || levelNum < 1 || levelNum > 4) {
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

  const node = levels.find((n) => n.level === levelNum);
  if (!node || !node.scenarioId) {
    notFound();
  }

  if (node.locked) {
    redirect(`/training/${rawCategory}`);
  }

  const scenario = await trainingRepo.getGuidedScenario(node.scenarioId);

  const backHref = `/training/${rawCategory}`;
  const replayHref = `/training/${rawCategory}/${levelNum}`;
  const nextHref =
    levelNum < 4
      ? `/training/${rawCategory}/${levelNum + 1}`
      : `/training/${rawCategory}`;

  return (
    <ScenarioPlayer
      scenario={scenario}
      categoryName={category.name}
      colorToken={category.colorToken}
      backHref={backHref}
      replayHref={replayHref}
      nextHref={nextHref}
      onStart={startAttemptAction}
      onAnswer={answerStepAction}
      onFinish={finishAttemptAction}
    />
  );
}

export default function ScenarioPage({ params }: ScenarioPageProps) {
  return (
    <Suspense fallback={<div aria-busy="true" className="min-h-dvh bg-cream" />}>
      <ScenarioContent params={params} />
    </Suspense>
  );
}
