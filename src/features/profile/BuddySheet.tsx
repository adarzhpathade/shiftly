"use client";

import { motion } from "motion/react";
import { useState, useTransition } from "react";
import { AnimatedCheck, Avatar, BUDDIES, BUDDY_KEYS, BracketHeadline, Button, ShakeText, cn, type BuddyKey } from "@/components/ui";
import { Sheet } from "./Sheet";

export interface BuddySheetProps {
  open: boolean;
  onClose: () => void;
  name: string;
  current: string;
  onSave: (avatarKey: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  onSaved: (avatarKey: BuddyKey) => void;
}

export function BuddySheet({ open, onClose, name, current, onSave, onSaved }: BuddySheetProps) {
  const initial = BUDDY_KEYS.find((k) => k === current) ?? "buddy-1";
  const [value, setValue] = useState<BuddyKey>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await onSave(value);
        if (res.ok) {
          onSaved(value);
          onClose();
        } else {
          setError(res.error);
        }
      } catch {
        setError("Could not save. Try again.");
      }
    });
  };

  return (
    <Sheet open={open} onClose={onClose} title="Change your buddy">
      <BracketHeadline size="h2">{"Pick your [buddy]"}</BracketHeadline>
      <p className="mt-1 text-[14px] font-medium text-ink-soft">Hi {name.split(/\s+/)[0] || "you"}, who cheers you on?</p>
      <div role="radiogroup" aria-label="Choose your buddy" className="mt-5 grid grid-cols-3 gap-x-2 gap-y-4">
        {BUDDY_KEYS.map((key) => {
          const selected = key === value;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={BUDDIES[key].label}
              onClick={() => setValue(key)}
              className="group flex flex-col items-center gap-1.5 rounded-card p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink"
            >
              <motion.span
                initial={false}
                animate={selected ? { scale: [1, 1.18, 1.05] } : { scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={cn(
                  "relative rounded-full",
                  selected ? "ring-4 ring-ink ring-offset-[3px] ring-offset-cream" : "group-active:scale-95",
                )}
              >
                <Avatar name={BUDDIES[key].label} avatarKey={key} size="lg" />
                {selected && (
                  <span className="absolute -right-1 -bottom-1 grid size-6 place-items-center rounded-full bg-ink text-lime">
                    <AnimatedCheck />
                  </span>
                )}
              </motion.span>
              <span className={cn("text-[13px] font-bold", selected ? "text-ink" : "text-ink-soft")}>
                {BUDDIES[key].label}
              </span>
            </button>
          );
        })}
      </div>
      {error && (
        <ShakeText role="alert" className="mt-4 rounded-card bg-paper p-3 text-center text-[14px] font-bold text-red">
          {error}
        </ShakeText>
      )}
      <div className="mt-6 flex flex-col gap-2">
        <Button variant="ink" size="lg" fullWidth onClick={save} disabled={pending}>
          {pending ? "Saving..." : "Save buddy"}
        </Button>
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="min-h-12 rounded-pill bg-paper px-6 text-[15px] font-extrabold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lav-ink"
        >
          Cancel
        </button>
      </div>
    </Sheet>
  );
}
