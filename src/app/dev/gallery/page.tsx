import type { ReactNode } from "react";
import {
  Avatar,
  AVATAR_KEYS,
  BracketHeadline,
  Button,
  Card,
  BUDDY_KEYS,
  ChatBubble,
  AnimatedCheck,
  AnimatedWordmark,
  Chip,
  ChoiceCard,
  Drop,
  GAME_OBJECT_NAMES,
  GameObject,
  HabitRow,
  MasteryRing,
  MoodMeter,
  PhotoCard,
  Pop,
  PopIn,
  Rise,
  RiseHeadline,
  RiseText,
  ShakeText,
  Stagger,
  Sticker,
  StepDots,
  StreakPill,
  TabBar,
  TextField,
  XpBar,
  type ChipTone,
  type SoftTone,
  type SurfaceTone,
  type TabKey,
} from "@/components/ui";
import { LoadersDemo } from "./LoadersDemo";
import { PhoneFrame } from "./phone-frame";

export const metadata = { title: "UI kit gallery" };

const SURFACE_TONES: SurfaceTone[] = ["paper", "peach", "sky", "lav", "lime", "ink"];
const CHIP_TONES: ChipTone[] = ["lime", "lav", "peach", "sky", "paper"];
const TAB_KEYS: TabKey[] = ["home", "training", "habits", "leaderboard", "profile"];
const SWATCHES = [
  ["cream", "bg-cream"],
  ["paper", "bg-paper"],
  ["ink", "bg-ink"],
  ["lime", "bg-lime"],
  ["lav", "bg-lav"],
  ["lav-ink", "bg-lav-ink"],
  ["red", "bg-red"],
  ["sky", "bg-sky"],
  ["peach", "bg-peach"],
  ["muted", "bg-muted"],
  ["xp-gold", "bg-xp-gold"],
  ["flame", "bg-flame"],
] as const;

function Section({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-14">
      <BracketHeadline as="h2" size="h2">
        {title}
      </BracketHeadline>
      {sub && <p className="mt-1.5 text-ink-soft">{sub}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Grid({ children, min = 260 }: { children: ReactNode; min?: number }) {
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(${min}px, 100%), 1fr))` }}
    >
      {children}
    </div>
  );
}

function Tile({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="rounded-[24px] bg-paper/60 p-4">
      <p className="mb-3 font-mono text-[11px] font-semibold tracking-wider text-ink-soft uppercase">
        {label}
      </p>
      <div className={className}>{children}</div>
    </div>
  );
}

function SectionHead({ title, aside }: { title: ReactNode; aside?: string }) {
  return (
    <div className="mt-[22px] mb-2.5 flex items-baseline justify-between">
      <b className="text-[22px] font-extrabold tracking-[-0.02em]">{title}</b>
      {aside && (
        <span className="text-xs font-semibold text-ink-soft">{aside}</span>
      )}
    </div>
  );
}

const CATEGORIES: Array<{
  title: string;
  badge: string;
  tone: SurfaceTone;
  object: "megaphone" | "bubble" | "cloud" | "puzzle";
  delay: number;
}> = [
  { title: "Handling Complaints", badge: "3 / 5", tone: "peach", object: "megaphone", delay: 0 },
  { title: "Customer Queries", badge: "2 / 5", tone: "sky", object: "bubble", delay: -1.3 },
  { title: "Difficult Customers", badge: "1 / 5", tone: "lav", object: "cloud", delay: -2.6 },
  { title: "Problem Solving", badge: "New", tone: "lime", object: "puzzle", delay: 0 },
];

function HomeDemo() {
  return (
    <PhoneFrame
      label="Home"
      tall
      overlay={<TabBar active="home" placement="absolute" hrefs={{ home: "#", training: "#", habits: "#", leaderboard: "#", profile: "#" }} />}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5 text-[26px] font-extrabold tracking-[-0.04em]">
          shiftly
          <svg viewBox="0 0 24 24" aria-hidden="true" className="mb-2.5 size-[18px] fill-ink">
            <path d="M12 1l2.2 6.2L20.5 5l-3.7 5.4L23 12l-6.2 1.6 3.7 5.4-6.3-2.2L12 23l-2.2-6.2L3.5 19l3.7-5.4L1 12l6.2-1.6L3.5 5l6.3 2.2z" />
          </svg>
        </div>
        <StreakPill count={12} />
      </div>

      <BracketHeadline className="mt-[18px]">
        {"Morning,\nAdarsh [ready?]"}
      </BracketHeadline>

      <XpBar className="mt-3.5" level={4} xp={640} nextXp={1000} />

      <PhotoCard
        className="mt-[18px]"
        placeholderLabel="Photo: support agent on a call"
        chip="Today's challenge"
        title="Calm the [angry] caller"
        sticker="headset"
        cta={
          <Button variant="lime" size="sm" className="font-extrabold">
            Play · +50 XP
          </Button>
        }
      />

      <SectionHead title="Training" aside="4 categories" />
      <div className="grid grid-cols-2 gap-2.5">
        {CATEGORIES.map((c) => (
          <Card key={c.title} tone={c.tone} className="h-[156px]">
            <b className="relative z-10 block text-lg leading-none font-extrabold tracking-[-0.02em]">
              {c.title}
            </b>
            <small className="absolute bottom-3 left-3.5 rounded-pill bg-paper/75 px-2 py-[3px] text-[11px] font-bold">
              {c.badge}
            </small>
            <GameObject
              name={c.object}
              size={104}
              float
              floatDelay={c.delay}
              className="absolute -right-2.5 -bottom-2"
            />
          </Card>
        ))}
      </div>

      <SectionHead
        title={<>Small habits, <span className="text-lav-ink">[big wins]</span></>}
        aside="2 / 3"
      />
      <div className="flex flex-col gap-2">
        <HabitRow emoji="⏰" tone="peach" title="Be on time" streakText="12 day streak" checked />
        <HabitRow emoji="📞" tone="sky" title="Customer follow-up" streakText="5 day streak" checked />
        <HabitRow emoji="📘" tone="lav" title="Learn 10 minutes" streakText="3 day streak" />
      </div>
    </PhoneFrame>
  );
}

function ScenarioDemo() {
  return (
    <PhoneFrame
      label="Scenario (kit demo)"
      tall
      overlay={
        <div className="absolute inset-x-4 bottom-[18px] z-30">
          <Button fullWidth size="lg">
            Continue
          </Button>
        </div>
      }
    >
      <Chip tone="lav">Difficult Customers</Chip>
      <BracketHeadline className="mt-2.5 text-[34px]">
        {"The [third] call this week"}
      </BracketHeadline>
      <div className="mt-[18px] flex items-center gap-2.5">
        <Avatar name="Mr. Sharma" tone="peach" />
        <div>
          <b className="block text-sm">Mr. Sharma</b>
          <small className="text-xs text-ink-soft">Customer · waiting on a refund</small>
        </div>
      </div>
      <ChatBubble className="mt-2.5">
        {"“This is the THIRD time I’m calling about my refund. Does anyone there actually do their job?!”"}
      </ChatBubble>
      <p className="mt-5 mb-2.5 text-[13px] font-bold tracking-[0.06em] text-ink-soft uppercase">
        How do you reply?
      </p>
      <div className="flex flex-col gap-2">
        <ChoiceCard
          choiceKey="A"
          state="best"
          feedbackTitle="Best answer · +30 XP"
          feedback="You apologised, took ownership and promised follow-through."
          feedbackAside={<Sticker pose="cheer" size={64} />}
        >
          {"“I’m really sorry you’ve had to call again. Let me check your refund right now and stay with you until it’s sorted.”"}
        </ChoiceCard>
        <ChoiceCard choiceKey="B">
          {"“Please calm down, sir. Refunds take 7–10 working days.”"}
        </ChoiceCard>
        <ChoiceCard choiceKey="C">{"“I’ll transfer you to the refunds team.”"}</ChoiceCard>
      </div>
    </PhoneFrame>
  );
}

function LevelUpDemo() {
  return (
    <PhoneFrame
      label="Level up (kit demo)"
      tall
      className="bg-lav"
      screenClassName="text-center"
      overlay={
        <div className="absolute inset-x-4 bottom-[18px] z-30">
          <Button fullWidth size="lg">
            Keep going
          </Button>
        </div>
      }
    >
      <p className="mt-[30px] text-[13px] font-bold tracking-[0.1em] uppercase">
        You did it, Adarsh
      </p>
      <PopIn>
        <BracketHeadline size="display" highlightTone="paper" className="mt-2.5">
          {"LEVEL\n[5]"}
        </BracketHeadline>
      </PopIn>
      <div className="relative mt-1 h-[280px]">
        <GameObject name="trophy" size={210} float className="absolute top-2.5 left-1/2 -ml-[105px] -rotate-6" />
        <GameObject name="gift" size={110} float floatDelay={-1.3} className="absolute top-[140px] left-1.5 -rotate-[14deg]" />
        <GameObject name="coin" size={80} float floatDelay={-2.6} className="absolute top-[30px] right-3.5 rotate-[18deg]" />
        <Sticker pose="cheer" size={120} className="absolute -bottom-1.5 right-1 rotate-6" />
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <span className="rounded-pill bg-lime px-3.5 py-2 text-[13px] font-bold">+120 XP</span>
        <span className="rounded-pill bg-paper px-3.5 py-2 text-[13px] font-bold">New badge: Calm Master</span>
      </div>
      <BracketHeadline as="p" size="h3" highlightTone="paper" className="mt-[18px]">
        {"Small steps, [big feelings]"}
      </BracketHeadline>
    </PhoneFrame>
  );
}

export default function GalleryPage() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 pt-10 pb-24">
      <div className="flex flex-wrap items-center gap-4">
        <BracketHeadline size="display" className="text-[clamp(3rem,14vw,4rem)]">
          {"Kit [gallery]"}
        </BracketHeadline>
        <Sticker pose="wave" size={110} />
      </div>
      <p className="mt-3 max-w-[640px] text-[17px] text-ink-soft">
        Every UI kit component in every variant and state. Dev only: this route
        returns 404 in production.
      </p>

      <Section title="[Colours]" sub="Tokens from src/styles/tokens.css.">
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
          {SWATCHES.map(([name, cls]) => (
            <div key={name} className="text-xs font-semibold">
              <i className={`block h-10 rounded-[10px] ring-1 ring-ink/15 ${cls}`} />
              {name}
            </div>
          ))}
        </div>
      </Section>

      <Section title="[Buttons]" sub="ink, lime, paper; md/lg (48px+ targets); sm for pills inside cards.">
        <Grid>
          <Tile label="ink" className="flex flex-wrap items-center gap-3">
            <Button>Get started</Button>
            <Button size="lg">Large</Button>
            <Button size="sm">Small</Button>
            <Button disabled>Disabled</Button>
          </Tile>
          <Tile label="lime" className="flex flex-wrap items-center gap-3">
            <Button variant="lime">Play · +50 XP</Button>
            <Button variant="lime" size="lg">Large</Button>
            <Button variant="lime" disabled>Disabled</Button>
          </Tile>
          <Tile label="paper" className="flex flex-wrap items-center gap-3">
            <Button variant="paper">Maybe later</Button>
            <Button variant="paper" size="lg">Large</Button>
            <Button variant="paper" disabled>Disabled</Button>
          </Tile>
          <Tile label="fullWidth">
            <Button fullWidth size="lg">Continue</Button>
          </Tile>
        </Grid>
      </Section>

      <Section title="[Chips]">
        <div className="flex flex-wrap gap-2.5">
          {CHIP_TONES.map((t) => (
            <Chip key={t} tone={t}>{t}</Chip>
          ))}
        </div>
      </Section>

      <Section title="[Cards]" sub="Tones, plus padding none / sm / md / lg.">
        <Grid min={150}>
          {SURFACE_TONES.map((t) => (
            <Card key={t} tone={t} padding="lg" className="min-h-[110px]">
              <b className="text-lg font-extrabold">{t}</b>
              <p className="mt-1 text-[13px] opacity-75">padding lg</p>
            </Card>
          ))}
          {(["none", "sm", "md"] as const).map((p) => (
            <Card key={p} padding={p} tone="lav" className="min-h-[110px] ring-1 ring-ink/10">
              <b className="text-lg font-extrabold">padding {p}</b>
            </Card>
          ))}
        </Grid>
      </Section>

      <Section title="[Headlines]" sub="Bricolage 800, tight tracking. [Brackets] become the highlight.">
        <Grid min={300}>
          <Tile label="display (celebration)" className="overflow-hidden">
            <BracketHeadline size="display">{"LEVEL\n[5]"}</BracketHeadline>
          </Tile>
          <Tile label="h1">
            <BracketHeadline size="h1" as="p">{"Morning,\nAdarsh [ready?]"}</BracketHeadline>
          </Tile>
          <Tile label="h2">
            <BracketHeadline size="h2" as="p">{"Three key [screens]"}</BracketHeadline>
          </Tile>
          <Tile label="h3">
            <BracketHeadline size="h3" as="p">{"Small habits, [big wins]"}</BracketHeadline>
          </Tile>
          <div className="rounded-[24px] bg-lime p-4">
            <p className="mb-3 font-mono text-[11px] font-semibold tracking-wider uppercase">paper on lime</p>
            <BracketHeadline size="h1" as="p" highlightTone="paper">{"Small habits, [big wins]"}</BracketHeadline>
          </div>
          <div className="rounded-[24px] bg-lav p-4">
            <p className="mb-3 font-mono text-[11px] font-semibold tracking-wider uppercase">paper on lav</p>
            <BracketHeadline size="h1" as="p" highlightTone="paper">{"Small steps, [big feelings]"}</BracketHeadline>
          </div>
          <div className="rounded-[24px] bg-ink p-4 text-cream">
            <p className="mb-3 font-mono text-[11px] font-semibold tracking-wider uppercase">lav on ink</p>
            <BracketHeadline size="h1" as="p" highlightTone="lav">{"Calm the [angry] caller"}</BracketHeadline>
          </div>
        </Grid>
      </Section>

      <Section title="[Tab bar]" sub="Floating pill, five items, active = lime circle.">
        <Grid min={320}>
          {TAB_KEYS.map((k) => (
            <Tile key={k} label={`active=${k}`}>
              <TabBar active={k} hrefs={{ home: "#", training: "#", habits: "#", leaderboard: "#", profile: "#" }} />
            </Tile>
          ))}
        </Grid>
      </Section>

      <Section title="[Progress]" sub="XpBar, MasteryRing, StreakPill.">
        <Grid>
          <Tile label="XpBar">
            <div className="flex flex-col gap-4">
              <XpBar level={4} xp={640} nextXp={1000} />
              <XpBar level={1} xp={0} nextXp={500} />
              <XpBar level={9} xp={980} nextXp={1000} />
            </div>
          </Tile>
          <Tile label="MasteryRing" className="flex flex-wrap items-center gap-4">
            <MasteryRing value={25} tone="red" />
            <MasteryRing value={60} tone="xp-gold" />
            <MasteryRing value={85} tone="lime" />
            <MasteryRing value={100} tone="lav-ink" size={96} strokeWidth={10}>
              <GameObject name="medal" size={40} />
            </MasteryRing>
          </Tile>
          <Tile label="StreakPill" className="flex flex-wrap items-center gap-3">
            <StreakPill count={1} />
            <StreakPill count={12} />
            <StreakPill count={365} />
          </Tile>
        </Grid>
      </Section>

      <Section title="[Training]" sub="ChatBubble, ChoiceCard states, MoodMeter.">
        <Grid min={300}>
          <Tile label="ChatBubble" className="flex flex-col gap-2">
            <ChatBubble>Hi, my order never arrived. Can you help?</ChatBubble>
            <ChatBubble from="user">Of course, let me look into it right now.</ChatBubble>
          </Tile>
          <Tile label="ChoiceCard idle / selected" className="flex flex-col gap-2">
            <ChoiceCard choiceKey="A">I will check your order right away.</ChoiceCard>
            <ChoiceCard choiceKey="B" state="selected">Please hold while I transfer you.</ChoiceCard>
          </Tile>
          <Tile label="ChoiceCard revealed" className="flex flex-col gap-3">
            <ChoiceCard choiceKey="A" state="best" feedbackTitle="Best answer · +30 XP" feedback="Ownership and a clear next step.">
              I am sorry about that. Let me fix it now.
            </ChoiceCard>
            <ChoiceCard choiceKey="B" state="okay" feedbackTitle="Okay · +10 XP" feedback="Polite, but no ownership yet.">
              Let me find out who can help.
            </ChoiceCard>
            <ChoiceCard choiceKey="C" state="poor" feedbackTitle="Not quite · +0 XP" feedback="This can sound dismissive.">
              That is our policy, sir.
            </ChoiceCard>
          </Tile>
          <Tile label="MoodMeter 10 / 50 / 90" className="flex flex-col gap-3">
            <MoodMeter value={10} />
            <MoodMeter value={50} />
            <MoodMeter value={90} />
          </Tile>
        </Grid>
      </Section>

      <Section title="[Habits and people]">
        <Grid>
          <Tile label="HabitRow" className="flex flex-col gap-2">
            <HabitRow emoji="⏰" tone="peach" title="Be on time" streakText="12 day streak" checked />
            <HabitRow emoji="📘" tone="lav" title="Learn 10 minutes" streakText="3 day streak" />
            <HabitRow emoji="💧" tone="sky" title="Drink water" />
          </Tile>
          <Tile label="Avatar sizes + keys" className="flex flex-wrap items-center gap-3">
            <Avatar name="Adarsh Kumar" size="sm" />
            <Avatar name="Adarsh Kumar" />
            <Avatar name="Adarsh Kumar" size="lg" tone="lime" />
            {(Object.keys(AVATAR_KEYS) as Array<keyof typeof AVATAR_KEYS>).map((k, i) => {
              const tones: SoftTone[] = ["peach", "sky", "lav", "lime", "muted", "paper"];
              return <Avatar key={k} name={k} avatarKey={k} size="lg" tone={tones[i % tones.length]} />;
            })}
          </Tile>
          <Tile label="Buddy avatars (buddy-1 .. buddy-6)" className="flex flex-wrap items-center gap-3">
            {BUDDY_KEYS.map((k) => (
              <Avatar key={k} name={k} avatarKey={k} size="xl" />
            ))}
            <Avatar name="Buddy small" avatarKey="buddy-4" size="sm" />
            <Avatar name="Buddy medium" avatarKey="buddy-2" />
          </Tile>
          <Tile label="TextField" className="flex flex-col gap-3">
            <TextField label="Email" placeholder="name@company.com" />
            <TextField label="Password" type="password" hint="At least 8 characters" defaultValue="abc" />
            <TextField label="Name" error="Name must be between 2 and 60 characters" defaultValue="A" />
          </Tile>
          <Tile label="StepDots" className="flex flex-col gap-3">
            <StepDots count={2} active={0} />
            <StepDots count={3} active={1} />
          </Tile>
        </Grid>
      </Section>

      <Section title="[Motion]" sub="Stagger, Rise, Pop, Drop, RiseText, ShakeText, AnimatedCheck, AnimatedWordmark. They play on load; reduced motion falls back to fades.">
        <Grid>
          <Tile label="Stagger + Rise / Pop / Drop" className="flex flex-col items-center">
            <Stagger className="flex w-full flex-col items-center gap-2">
              <Rise>
                <Chip tone="lime">Rise</Chip>
              </Rise>
              <div className="flex items-end gap-3">
                <Pop wiggle>
                  <GameObject name="coin" size={64} float />
                </Pop>
                <Drop delay={0.2}>
                  <GameObject name="gift" size={80} float />
                </Drop>
              </div>
              <Rise>
                <p className="text-sm font-semibold text-ink-soft">Fades up last</p>
              </Rise>
            </Stagger>
          </Tile>
          <Tile label="RiseHeadline (letters)" className="flex flex-col items-center gap-3">
            <RiseHeadline size="display" by="letters">
              {"LEVEL\n[UP]"}
            </RiseHeadline>
          </Tile>
          <Tile label="RiseText (words)" className="flex flex-col items-center gap-3">
            <RiseText className="text-center text-xl font-extrabold">Small habits, [big wins]</RiseText>
          </Tile>
          <Tile label="ThemeColor / useThemeColor" className="text-sm font-semibold">
            Sets the phone browser bar colour to a page token and restores it on unmount:
            <code> useThemeColor(&quot;lav&quot;)</code> or <code>&lt;ThemeColor color=&quot;lav&quot; /&gt;</code>.
          </Tile>
          <Tile label="AnimatedWordmark" className="flex justify-center">
            <AnimatedWordmark sizeClass="text-[44px]" />
          </Tile>
          <Tile label="ShakeText + AnimatedCheck" className="flex flex-col items-center gap-3">
            <ShakeText className="text-[14px] font-bold text-red">Please enter a valid email</ShakeText>
            <span className="grid size-9 place-items-center rounded-full bg-ink text-lime">
              <AnimatedCheck className="size-5" />
            </span>
          </Tile>
        </Grid>
      </Section>

      <Section title="[Sticker] buddy" sub="Loose line, white sticker edge: wave, headset, cheer, think, sign, cover, thumbs, shrug, key.">
        <div className="flex flex-wrap gap-2">
          {(["wave", "headset", "cheer", "think", "sign", "cover", "thumbs", "shrug", "key"] as const).map((p) => (
            <Sticker key={p} pose={p} size={110} label={`Sticker: ${p}`} />
          ))}
        </div>
      </Section>

      <Section title="[3D objects]" sub="Stand-ins for the AI renders. Swap per object in game-object-sources.ts.">
        <div className="rounded-[24px] bg-lav p-4">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-7">
            {GAME_OBJECT_NAMES.map((n, i) => (
              <figure key={n} className="m-0 text-center text-xs font-bold">
                <GameObject name={n} size={96} float floatDelay={-(i % 3) * 1.3} className="mx-auto h-auto w-full max-w-24" />
                {n}
              </figure>
            ))}
          </div>
        </div>
      </Section>

      <Section title="[Photo card]" sub="Placeholder gradient when there is no image; sticker optional.">
        <Grid min={320}>
          <div className="pt-12">
            <PhotoCard
              placeholderLabel="Photo: support agent on a call"
              chip="Today's challenge"
              title="Calm the [angry] caller"
              sticker="headset"
              cta={<Button variant="lime" size="sm">Play · +50 XP</Button>}
            />
          </div>
          <div className="pt-12">
            <PhotoCard
              chip="New"
              chipTone="lav"
              title="Own the [handover]"
              cta={<Button variant="paper" size="sm">Start</Button>}
            />
          </div>
        </Grid>
      </Section>

      <Section
        title="[Loaders]"
        sub="ShiftLoader (The Shift Change), Button loading, Shimmer skeletons, typing bubble, scene and call loaders."
      >
        <LoadersDemo />
      </Section>

      <Section title="[Phone] column" sub="360px frames: the real target width.">
        <div className="flex flex-wrap justify-center gap-7">
          <PhoneFrame label="Chat + mood">
            <MoodMeter value={32} />
            <div className="mt-3 flex flex-col gap-2">
              <ChatBubble>Hello? Is anyone there? My internet has been down all day.</ChatBubble>
              <ChatBubble from="user">I am so sorry. Let me look at your line right now.</ChatBubble>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Chip tone="lime">Apologise</Chip>
              <Chip tone="sky">Ask details</Chip>
              <Chip tone="peach">Escalate</Chip>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <HabitRow emoji="📞" tone="sky" title="Customer follow-up" streakText="5 day streak" checked />
              <HabitRow emoji="📘" tone="lav" title="Learn 10 minutes" streakText="3 day streak" />
            </div>
            <div className="mt-6 flex items-center justify-between">
              <MasteryRing value={72} tone="lime" />
              <XpBar className="ml-4 flex-1" level={4} xp={640} nextXp={1000} />
            </div>
          </PhoneFrame>
        </div>
      </Section>

      <Section title="[Home] (kit demo)" sub="The preview's three key screens, rebuilt from kit components with hard-coded props.">
        <div className="flex flex-wrap justify-center gap-7">
          <HomeDemo />
          <ScenarioDemo />
          <LevelUpDemo />
        </div>
      </Section>
    </main>
  );
}
