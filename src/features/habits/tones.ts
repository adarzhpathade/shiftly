/** Rotating soft tile colours for habit icons (full class strings for Tailwind). */
export const HABIT_TONES = ["bg-peach", "bg-sky", "bg-lav", "bg-lime"] as const;

export const toneFor = (index: number): string =>
  HABIT_TONES[index % HABIT_TONES.length] as string;

export const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"] as const;
export const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
export const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function scheduleLabel(days: readonly number[]): string {
  if (days.length === 7) return "Every day";
  return [...days]
    .sort((a, b) => a - b)
    .map((d) => DAY_SHORT[d - 1])
    .join(", ");
}
