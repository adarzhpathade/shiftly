"use client";

import { Rise, Stagger } from "@/components/ui/Motion";
import { ThemeColor } from "@/components/ui/ThemeColor";
import type { HomeData, LeaderboardEntry } from "@/lib/types";
import { CategoryGrid } from "./CategoryGrid";
import { HabitStrip } from "./HabitStrip";
import { HomeHeader } from "./HomeHeader";
import { LeaderboardTeaser } from "./LeaderboardTeaser";
import { QuestList } from "./QuestList";
import { TodayCard } from "./TodayCard";

export interface HomeScreenProps {
  data: HomeData;
  myRank: LeaderboardEntry | null;
}

export function HomeScreen({ data, myRank }: HomeScreenProps) {
  return (
    <main className="mx-auto w-full max-w-md overflow-x-clip px-4 pt-[18px]">
      <ThemeColor color="cream" />
      <Stagger className="flex flex-col gap-[22px]" gap={0.07}>
        <Rise>
          <HomeHeader
            user={data.user}
            streak={data.streak}
            xpProgress={data.xpProgress}
            xpToNext={data.xpToNext}
          />
        </Rise>
        <Rise>
          <TodayCard
            challenge={data.challenge}
            continueTraining={data.continueTraining}
          />
        </Rise>
        <Rise>
          <QuestList quests={data.quests} />
        </Rise>
        <Rise>
          <CategoryGrid categories={data.categories} />
        </Rise>
        <Rise>
          <HabitStrip habits={data.habits} />
        </Rise>
        <Rise>
          <LeaderboardTeaser myRank={myRank} />
        </Rise>
      </Stagger>
    </main>
  );
}
