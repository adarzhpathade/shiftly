"use client";

import { MotionConfig, motion } from "motion/react";
import { Avatar, cn, type BuddyKey } from "@/components/ui";

export type EmployeeIdCardProps = {
  name: string;
  /** Picked team name, or empty while none is picked. */
  team: string;
  /** People already on the team, when known. */
  memberCount?: number;
  /** The photo slot fills with the buddy once this is true. */
  showPhoto: boolean;
  buddy: BuddyKey;
  /** Stamp the card "HIRED". */
  stamped: boolean;
};

/** A stable, decorative four-digit badge number from the name (not a real id). */
export function badgeNumber(name: string): string {
  let h = 7;
  for (const ch of name.trim().toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) % 10000;
  return String(h).padStart(4, "0");
}

/**
 * The employee ID card that builds itself while the form is filled in: the name types in, then
 * the team, then the photo slot where the buddy pops in. A "HIRED" stamp lands on success.
 */
export function EmployeeIdCard({
  name,
  team,
  memberCount,
  showPhoto,
  buddy,
  stamped,
}: EmployeeIdCardProps) {
  const cleanName = name.trim();
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        role="group"
        aria-label="Your employee ID card"
        animate={stamped ? { rotate: [0, -2, 1.5, 0], y: [0, 4, 0] } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.45, delay: 0.25 }}
        className="relative mx-auto w-full max-w-[320px] rounded-[26px] bg-paper pb-3.5 shadow-lg shadow-ink/15"
      >
        <div className="flex justify-center pt-2.5">
          <span aria-hidden="true" className="h-2.5 w-14 rounded-pill bg-cream shadow-inner" />
        </div>
        <div className="mx-4 mt-2 flex items-center justify-between rounded-pill bg-ink px-3 py-1.5 text-[10px] font-extrabold tracking-[0.14em] text-cream uppercase">
          <span>Shiftly</span>
          <span>Employee ID</span>
        </div>

        <div className="flex items-center gap-4 p-4">
          <div
            className={cn(
              "relative grid size-[88px] flex-none place-items-center overflow-hidden rounded-[20px]",
              showPhoto ? "bg-lav" : "border-2 border-dashed border-ink/25 bg-cream",
            )}
          >
            {showPhoto ? (
              <motion.div
                initial={{ scale: 0.2, y: 24, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 380, damping: 14 }}
                className="size-full"
              >
                <Avatar name="Your buddy" avatarKey={buddy} size="xl" className="size-full rounded-none" />
              </motion.div>
            ) : (
              <span className="px-2 text-center text-[11px] leading-tight font-bold text-ink-soft">
                Photo
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-[0.1em] text-ink-soft uppercase">Name</p>
            <p
              className={cn(
                "line-clamp-2 min-h-[2.1em] text-[20px] leading-[1.05] font-extrabold tracking-tight break-words",
                cleanName ? "text-ink" : "text-ink/25",
              )}
              aria-live="polite"
            >
              {cleanName || "Your name"}
            </p>
            <div className="mt-2 min-h-[26px]">
              {team ? (
                <motion.span
                  key={team}
                  initial={{ opacity: 0, y: 6, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 420, damping: 20 }}
                  className="inline-block max-w-full truncate rounded-pill bg-lime px-2.5 py-1 text-[12px] leading-none font-extrabold"
                >
                  {team}
                  {memberCount !== undefined ? ` · ${memberCount}` : ""}
                </motion.span>
              ) : (
                <span className="inline-block rounded-pill bg-cream px-2.5 py-1 text-[12px] leading-none font-bold text-ink/30">
                  Team
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mx-4 flex items-center justify-between border-t-2 border-dashed border-ink/15 pt-2 text-[11px] font-bold text-ink-soft">
          <span>No. {badgeNumber(cleanName)}</span>
          <span aria-hidden="true" className="flex h-4 items-end gap-[2px]">
            {[10, 16, 8, 14, 16, 9, 13, 16, 8, 12].map((h, i) => (
              <i key={i} className="w-[2.5px] bg-ink/60" style={{ height: h }} />
            ))}
          </span>
        </div>

        {stamped && (
          <div
            role="img"
            aria-label="Hired"
            className="pointer-events-none absolute inset-0 flex items-end justify-end pr-3 pb-9"
          >
            <motion.span
              initial={{ scale: 2.4, opacity: 0, rotate: -4 }}
              animate={{ scale: 1, opacity: 0.92, rotate: -14 }}
              transition={{ type: "spring", stiffness: 520, damping: 17, delay: 0.1 }}
              className="rounded-[14px] border-[5px] border-red px-4 py-0.5 text-[34px] leading-[1.1] font-extrabold tracking-[0.06em] text-red"
            >
              HIRED
            </motion.span>
          </div>
        )}
      </motion.div>
    </MotionConfig>
  );
}
