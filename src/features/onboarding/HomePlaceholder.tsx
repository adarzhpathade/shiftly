import { Avatar, BracketHeadline, Button, Wordmark } from "@/components/ui";

export type HomePlaceholderProps = {
  name: string;
  avatarKey: string;
  /** Form action that logs the user out. */
  onLogout: () => void | Promise<void>;
};

/** Temporary home until the real Home screen (UI2) lands. */
export function HomePlaceholder({ name, avatarKey, onLogout }: HomePlaceholderProps) {
  const first = name.trim().split(/\s+/)[0] || "there";
  return (
    <main className="min-h-dvh bg-cream">
      <div className="mx-auto flex min-h-dvh max-w-[440px] flex-col px-gutter pt-5 pb-8">
        <header className="flex items-center justify-between">
          <Wordmark />
          <Avatar name={name} avatarKey={avatarKey} size="md" />
        </header>
        <BracketHeadline size="h1" className="mt-10">
          {`Hi ${first},\nyou're [in]`}
        </BracketHeadline>
        <p className="mt-3 text-[15px] font-semibold text-ink-soft">
          Home is coming soon. Your profile and first habits are saved.
        </p>
        <form action={onLogout} className="mt-auto pt-10">
          <Button type="submit" variant="paper" size="lg" fullWidth>
            Log out
          </Button>
        </form>
      </div>
    </main>
  );
}
