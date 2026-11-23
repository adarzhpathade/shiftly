"use client";

import { MotionConfig, motion } from "motion/react";
import { BUDDIES, type BuddyKey } from "@/assets/stickers";
import { Sticker, type StickerPose } from "./Sticker";
import { cn } from "./cn";

export type PeekBuddyProps = {
  /** Which buddy to draw (the pose is chosen separately so the buddy can react). */
  buddy?: BuddyKey;
  pose: StickerPose;
  /** Rendered sticker width in px. */
  size?: number;
  /** Text on the sign held up in the `sign` pose. `[bracket]` words get the lavender highlight. */
  sign?: string;
  /** Wobble side to side (a wrong answer). Re-run it by changing `wobbleKey`. */
  wobble?: boolean;
  wobbleKey?: number;
  /** Accessible label. Omit for a decorative buddy. */
  label?: string;
  className?: string;
};

const SIGN_PARTS = /(\[[^\]]+\])/g;

/**
 * A buddy that reacts: the pose swaps with a little pop, can wobble, and in the `sign` pose
 * holds up a small hand-lettered sign. Meant to sit on the top edge of a card so only the
 * feet are tucked behind it. Motion is transform-only and flattens for reduced motion.
 */
export function PeekBuddy({
  buddy = "buddy-1",
  pose,
  size = 150,
  sign,
  wobble = false,
  wobbleKey = 0,
  label,
  className,
}: PeekBuddyProps) {
  const accessory = BUDDIES[buddy].accessory;
  const height = (size * 130) / 120;
  return (
    <MotionConfig reducedMotion="user">
      <div
        className={cn("relative", className)}
        style={{ width: size, height }}
        data-pose={pose}
        role={label ? "img" : undefined}
        aria-label={label}
      >
        <motion.div
          key={`${pose}-${wobbleKey}`}
          initial={{ scale: 0.9, rotate: wobble ? 0 : -3, opacity: 0.4 }}
          animate={
            wobble
              ? { scale: 1, opacity: 1, rotate: [0, -9, 8, -6, 5, -2, 0] }
              : { scale: 1, opacity: 1, rotate: 0 }
          }
          transition={
            wobble
              ? { duration: 0.8, ease: "easeInOut" }
              : { type: "spring", stiffness: 420, damping: 16 }
          }
          style={{ transformOrigin: "50% 100%" }}
        >
          <Sticker pose={pose} accessory={accessory} size={size} />
        </motion.div>
        {pose === "sign" && sign && (
          <motion.div
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 20, delay: 0.05 }}
            className="absolute flex items-center justify-center rounded-[7px] border-[2.5px] border-ink bg-paper text-center leading-none font-extrabold tracking-tight text-ink"
            style={{
              left: "15%",
              width: "70%",
              top: "64%",
              height: "26%",
              fontSize: size * 0.078,
              rotate: "-2deg",
            }}
          >
            <span>
              {sign.split(SIGN_PARTS).map((part, i) =>
                /^\[[^\]]+\]$/.test(part) ? (
                  <span key={i} className="text-lav-ink">
                    {part}
                  </span>
                ) : (
                  <span key={i}>{part}</span>
                ),
              )}
            </span>
          </motion.div>
        )}
      </div>
    </MotionConfig>
  );
}
