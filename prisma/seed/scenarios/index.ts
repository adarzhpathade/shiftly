import {
  ChoiceRating,
  Difficulty as PrismaDifficulty,
  type PrismaClient,
} from "../../../src/generated/prisma/client";
import type { Difficulty, Rating } from "../../../src/lib/types";
import { BOSS_PERSONAS, GUIDED_SCENARIOS } from "./content";

const ratingMap: Record<Rating, ChoiceRating> = {
  best: ChoiceRating.BEST,
  okay: ChoiceRating.OKAY,
  poor: ChoiceRating.POOR,
};

const difficultyMap: Record<Difficulty, PrismaDifficulty> = {
  beginner: PrismaDifficulty.BEGINNER,
  intermediate: PrismaDifficulty.INTERMEDIATE,
};

export async function seedScenarios(prisma: PrismaClient): Promise<void> {
  const categorySlugs = [
    "handling-complaints",
    "customer-queries",
    "difficult-customers",
    "problem-solving",
  ] as const;

  const categoryMap = new Map<string, string>();
  for (const slug of categorySlugs) {
    const cat = await prisma.category.findUnique({
      where: { slug },
      select: { id: true, slug: true },
    });
    if (!cat) {
      throw new Error(`Required category not found in database: ${slug}`);
    }
    categoryMap.set(slug, cat.id);
  }

  // 1. Scenarios, Steps, and Choices
  for (const scenario of GUIDED_SCENARIOS) {
    const categoryId = categoryMap.get(scenario.categoryKey);
    if (!categoryId) {
      throw new Error(`Category ID not resolved for scenario ${scenario.id}`);
    }

    await prisma.scenario.upsert({
      where: { id: scenario.id },
      update: {
        categoryId,
        level: scenario.level,
        title: scenario.title,
        situation: scenario.situation,
        difficulty: difficultyMap[scenario.difficulty],
        xpReward: scenario.xpReward,
        isPublished: true,
      },
      create: {
        id: scenario.id,
        categoryId,
        level: scenario.level,
        title: scenario.title,
        situation: scenario.situation,
        difficulty: difficultyMap[scenario.difficulty],
        xpReward: scenario.xpReward,
        isPublished: true,
      },
    });

    for (let sIdx = 0; sIdx < scenario.steps.length; sIdx++) {
      const step = scenario.steps[sIdx]!;
      await prisma.scenarioStep.upsert({
        where: { id: step.id },
        update: {
          scenarioId: scenario.id,
          order: sIdx + 1,
          customerMessage: step.customerMessage,
        },
        create: {
          id: step.id,
          scenarioId: scenario.id,
          order: sIdx + 1,
          customerMessage: step.customerMessage,
        },
      });

      for (const choice of step.choices) {
        await prisma.choice.upsert({
          where: { id: choice.id },
          update: {
            stepId: step.id,
            text: choice.text,
            rating: ratingMap[choice.rating],
            points: choice.points,
            feedback: choice.feedback,
            nextStepId: choice.nextStepId,
          },
          create: {
            id: choice.id,
            stepId: step.id,
            text: choice.text,
            rating: ratingMap[choice.rating],
            points: choice.points,
            feedback: choice.feedback,
            nextStepId: choice.nextStepId,
          },
        });
      }
    }
  }

  // 2. Boss Personas (unique on categoryId)
  for (const persona of BOSS_PERSONAS) {
    const categoryId = categoryMap.get(persona.categoryKey);
    if (!categoryId) {
      throw new Error(`Category ID not resolved for persona ${persona.id}`);
    }

    await prisma.bossPersona.upsert({
      where: { categoryId },
      update: {
        id: persona.id,
        name: persona.name,
        problem: persona.problem,
        startMood: persona.startMood,
        hiddenGoal: persona.hiddenGoal,
        systemPrompt: persona.systemPrompt,
        xpReward: persona.xpReward,
      },
      create: {
        id: persona.id,
        categoryId,
        name: persona.name,
        problem: persona.problem,
        startMood: persona.startMood,
        hiddenGoal: persona.hiddenGoal,
        systemPrompt: persona.systemPrompt,
        xpReward: persona.xpReward,
      },
    });
  }
}
