"use client";

import { MotionConfig } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Avatar, Card, MasteryRing, Pop, Rise, Stagger, StreakPill, ThemeColor, XpBar, cn, type RingTone } from "@/components/ui";
import { InstallButton } from "@/components/pwa/InstallPrompt";
import { QuestList } from "@/features/home/QuestList";
import { SectionHead } from "@/features/home/SectionHead";
import type { Badge, CategoryKey, Quest, UserProfile } from "@/lib/types";
import { BadgesGrid } from "./BadgesGrid";
import { BuddySheet } from "./BuddySheet";

const CATEGORY_UI: Record<CategoryKey, { name: string; tone: RingTone }> = {
  "handling-complaints": { name: "Complaints", tone: "flame" },
  "customer-queries": { name: "Queries", tone: "sky" },
  "difficult-customers": { name: "Difficult", tone: "lav-ink" },
  "problem-solving": { name: "Problems", tone: "lime" },
};

const BADGE_PREVIEW = 6;

export interface ProfileScreenProps {
  profile: UserProfile;
  badges: readonly Badge[];
  quests: readonly Quest[];
  onSaveBuddy: (avatarKey: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  /** Server-rendered log out form. */
  logout: ReactNode;
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center rounded-[18px] bg-paper px-1 py-3">
      <b className="text-[22px] leading-none font-extrabold tracking-tight tabular-nums">{value}</b>
      <span className="mt-1 text-[11px] font-bold text-ink-soft">{label}</span>
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn(
        "relative h-8 w-14 flex-none rounded-pill transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink",
        on ? "bg-ink" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "absolute top-1 left-1 size-6 rounded-full transition-transform duration-300 ease-spring",
          on ? "translate-x-6 bg-lime" : "bg-paper",
        )}
      />
    </button>
  );
}

export function ProfileScreen({ profile, badges, quests, onSaveBuddy, logout }: ProfileScreenProps) {
  const router = useRouter();
  const [buddyOpen, setBuddyOpen] = useState(false);
  const [avatarKey, setAvatarKey] = useState(profile.avatarKey);
  const [notify, setNotify] = useState(true);

  const sorted = [...badges].sort((a, b) => Number(b.earnedAt !== null) - Number(a.earnedAt !== null));
  const earned = badges.filter((b) => b.earnedAt !== null).length;
  const mastery = profile.stats.categoryMastery;

  return (
    <MotionConfig reducedMotion="user">
      <ThemeColor color="cream" />
      <main className="px-gutter pt-8">
        <Stagger gap={0.06}>
          <Rise>
            <Card tone="lav" padding="lg" className="rounded-[28px] text-center">
              <button
                type="button"
                onClick={() => setBuddyOpen(true)}
                aria-label="Change your buddy"
                className="group relative mx-auto block rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
              >
                <Avatar name={profile.name} avatarKey={avatarKey} size="xl" className="size-32 ring-4 ring-ink ring-offset-[3px] ring-offset-lav transition-transform group-active:scale-95" />
                <span className="absolute -right-1 -bottom-1 grid size-9 place-items-center rounded-full bg-ink text-cream">
                  <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 20h4L19 9l-4-4L4 16z" />
                  </svg>
                </span>
              </button>
              <h1 className="mt-3 text-[28px] leading-none font-extrabold tracking-tight">{profile.name}</h1>
              <p className="mt-1 text-[14px] font-semibold text-ink/70">{profile.teamName}</p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="rounded-pill bg-ink px-3.5 py-1 text-[13px] font-extrabold text-cream">Level {profile.level}</span>
                <StreakPill count={profile.currentStreak} />
              </div>
              <XpBar level={profile.level} xp={profile.xpIntoLevel} nextXp={profile.xpForNext} className="mt-4 text-left" />
            </Card>
          </Rise>

          <Pop>
            <div className="mt-3 flex gap-2" role="list" aria-label="Your stats">
              <Stat value={profile.xp} label="Total XP" />
              <Stat value={profile.stats.scenariosCompleted} label="Scenarios" />
              <Stat value={profile.stats.perfectScores} label="Perfect" />
              <Stat value={profile.bestStreak} label="Best streak" />
            </div>
          </Pop>

          <Rise>
            <section aria-label="Mastery" className="mt-7">
              <SectionHead title="Your [mastery]" />
              <div className="grid grid-cols-4 gap-2">
                {mastery.map((m) => {
                  const ui = CATEGORY_UI[m.categoryKey];
                  return (
                    <div key={m.categoryKey} className="flex flex-col items-center gap-1.5 rounded-[18px] bg-paper px-1 py-3">
                      <MasteryRing value={m.mastery * 100} tone={ui.tone} size={58} strokeWidth={7} label={`${ui.name} mastery`} />
                      <span className="text-[11px] font-bold text-ink-soft">{ui.name}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          </Rise>

          <Rise>
            <section aria-label="Badges" className="mt-7">
              <SectionHead title="Your [badges]" note={`${earned} / ${badges.length}`} />
              {badges.length === 0 ? (
                <Card tone="paper" className="rounded-[18px] text-center text-sm text-ink-soft">
                  No badges yet. Finish a scenario to earn your first.
                </Card>
              ) : (
                <BadgesGrid badges={sorted.slice(0, BADGE_PREVIEW)} />
              )}
              {badges.length > BADGE_PREVIEW && (
                <Link
                  href="/profile/badges"
                  className="mt-3 flex min-h-11 items-center justify-center rounded-pill bg-paper text-[14px] font-extrabold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink"
                >
                  See all {badges.length} badges
                </Link>
              )}
            </section>
          </Rise>

          <Rise>
            <div className="mt-7">
              <QuestList quests={quests} />
            </div>
          </Rise>

          <Rise>
            <section aria-label="Settings" className="mt-7">
              <SectionHead title="[Settings]" />
              <ul className="flex flex-col gap-2">
                <li className="flex items-center gap-3 rounded-[18px] bg-paper p-3.5">
                  <span className="min-w-0 flex-1">
                    <b className="block text-[15px]">Reminders</b>
                    <small className="text-xs font-semibold text-ink-soft">Daily nudges to keep your streak</small>
                  </span>
                  <Toggle on={notify} onChange={setNotify} label="Notifications" />
                </li>
                <li className="flex items-center gap-3 rounded-[18px] bg-paper p-3.5">
                  <span className="min-w-0 flex-1">
                    <b className="block text-[15px]">Install shiftly</b>
                    <small className="text-xs font-semibold text-ink-soft">Add it to your home screen</small>
                  </span>
                  <InstallButton className="flex-none" />
                </li>
                <li className="rounded-[18px] bg-paper p-3.5">
                  <b className="block text-[15px]">About</b>
                  <small className="text-xs font-semibold text-ink-soft">
                    shiftly, practice real customer moments and build daily habits.
                  </small>
                </li>
              </ul>
              <div className="mt-4 flex justify-center">{logout}</div>
            </section>
          </Rise>
        </Stagger>
      </main>

      <BuddySheet
        open={buddyOpen}
        onClose={() => setBuddyOpen(false)}
        name={profile.name}
        current={avatarKey}
        onSave={onSaveBuddy}
        onSaved={(key) => {
          setAvatarKey(key);
          router.refresh();
        }}
      />
    </MotionConfig>
  );
}
