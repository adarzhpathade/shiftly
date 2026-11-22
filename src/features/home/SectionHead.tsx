import { BracketHeadline } from "@/components/ui/BracketHeadline";

export interface SectionHeadProps {
  /** Title text; [word] segments get the lavender bracket highlight. */
  title: string;
  /** Small grey note on the right, e.g. "2 / 3". */
  note?: string;
}

/** Section row from the mock: 22px extrabold title left, small ink-soft note right. */
export function SectionHead({ title, note }: SectionHeadProps) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between gap-3">
      <BracketHeadline as="h2" size="h3">
        {title}
      </BracketHeadline>
      {note && (
        <span className="flex-none text-xs font-semibold text-ink-soft">
          {note}
        </span>
      )}
    </div>
  );
}
