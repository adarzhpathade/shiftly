import { ShiftLoading } from "@/components/ui";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { trainingRepo } from "@/data";
import { BOSS_PERSONAS } from "@/data/mock/data";
import { BossExperience, goalHintFor } from "@/features/boss";
import { MAX_BOSS_TURNS, MAX_REPLY_CHARS } from "@/lib/gamification";
import { requireViewer } from "@/server/auth/session";
import { finishBossAction, startBossAction } from "@/server/boss/actions";
import { isCategoryKey } from "@/server/training/types";

interface BossPageProps {
  params: Promise<{ category: string }>;
}

async function BossContent({ params }: BossPageProps) {
  const { category: rawCategory } = await params;
  if (!isCategoryKey(rawCategory)) notFound();

  const viewer = await requireViewer();
  const [categories, levels] = await Promise.all([
    trainingRepo.listCategories(viewer.id),
    trainingRepo.getLevelPath(viewer.id, rawCategory),
  ]);
  const category = categories.find((c) => c.key === rawCategory);
  const persona = BOSS_PERSONAS.find((p) => p.categoryKey === rawCategory);
  if (!category || !persona) notFound();

  const bossNode = levels.find((n) => n.level === 5);
  const gate = bossNode?.locked ? "locked" : "ok";

  return (
    <BossExperience
      categoryKey={rawCategory}
      categoryName={category.name}
      colorToken={category.colorToken}
      persona={{
        name: persona.name,
        problem: persona.problem,
        startMood: persona.startMood,
        goalHint: goalHintFor(rawCategory),
      }}
      gate={gate}
      lockedHref={`/training/${rawCategory}`}
      backHref={`/training/${rawCategory}`}
      fallbackHref={`/training/${rawCategory}/1`}
      maxTurns={MAX_BOSS_TURNS}
      maxChars={MAX_REPLY_CHARS}
      onStart={startBossAction}
      onFinish={finishBossAction}
    />
  );
}

export default function BossPage({ params }: BossPageProps) {
  return (
    <Suspense fallback={<ShiftLoading />}>
      <BossContent params={params} />
    </Suspense>
  );
}
