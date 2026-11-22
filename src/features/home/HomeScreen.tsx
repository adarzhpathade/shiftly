"use client";

import { Pop, Rise, Stagger } from "@/components/ui/Motion";
import { ThemeColor } from "@/components/ui/ThemeColor";
import type { HomeData, LeaderboardEntry } from "@/lib/types";
import { CategoryGrid } from "./CategoryGrid";
import { HabitList } from "./HabitList";
import { HomeHeader } from "./HomeHeader";
import { LeaderboardTeaser } from "./LeaderboardTeaser";
import { QuestList } from "./QuestList";
import { TodayCard } from "./TodayCard";

export interface HomeScreenProps {
  data: HomeData;
  myRank: LeaderboardEntry | null;
  onCheckIn: (
    habitId: string
  ) => Promise<
    | { ok: true; xpEarned: number; streak: number }
    | { ok: false; error: string }
  >;
}

export function HomeScreen({ data, myRank, onCheckIn }: HomeScreenProps) {
  return (
    <main className="mx-auto w-full max-w-md px-4 pt-5">
      <ThemeColor color="cream" />
      <Stagger className="flex flex-col gap-6" gap={0.07}>
        <Rise>
          <HomeHeader
            user={data.user}
            streak={data.streak}
            xpProgress={data.xpProgress}
            xpToNext={data.xpToNext}
          />
        </Rise>
        <Pop>
          <TodayCard
            challenge={data.challenge}
            continueTraining={data.continueTraining}
          />
        </Pop>
        <Rise>
          <QuestList quests={data.quests} />
        </Rise>
        <Rise>
          <HabitList habits={data.todaysHabits} onCheckIn={onCheckIn} />
        </Rise>
        <Rise>
          <CategoryGrid categories={data.categories} />
        </Rise>
        <Rise>
          <LeaderboardTeaser myRank={myRank} />
        </Rise>
      </Stagger>
    </main>
  );
}
