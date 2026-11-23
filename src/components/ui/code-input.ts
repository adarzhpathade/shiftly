/** Pure helpers for the one-time-code boxes (`CodeInput`). No React. */

export function digitsOnly(text: string): string {
  return text.replace(/\D/g, "");
}

export function emptyDigits(length: number): string[] {
  return Array.from({ length }, () => "");
}

export type DigitsUpdate = { digits: string[]; focus: number };

/**
 * A box changed to `raw`. One digit fills the box and moves on, an empty value clears it,
 * several digits (autofill, or typing over a filled box) fill forward from this box.
 */
export function applyInput(
  digits: readonly string[],
  index: number,
  raw: string,
  length = digits.length,
): DigitsUpdate {
  let clean = digitsOnly(raw);
  const next = [...digits];
  if (clean === "") {
    next[index] = "";
    return { digits: next, focus: index };
  }
  const existing = digits[index];
  // Typing into a box that already holds a digit gives two characters: keep the new one.
  if (existing && clean.length === 2) {
    clean = clean.replace(existing, "").slice(0, 1) || clean.slice(-1);
  }
  return fillFrom(next, index, clean, length);
}

/** Pasted text: a full-length code always replaces everything, otherwise it fills forward. */
export function applyPaste(
  digits: readonly string[],
  index: number,
  text: string,
  length = digits.length,
): DigitsUpdate {
  const clean = digitsOnly(text);
  if (clean.length >= length) return fillFrom(emptyDigits(length), 0, clean, length);
  return fillFrom([...digits], index, clean, length);
}

/** Backspace: clears this box, or steps back and clears the previous one when it is empty. */
export function applyBackspace(digits: readonly string[], index: number): DigitsUpdate {
  const next = [...digits];
  if (next[index]) {
    next[index] = "";
    return { digits: next, focus: index };
  }
  const prev = Math.max(0, index - 1);
  next[prev] = "";
  return { digits: next, focus: prev };
}

function fillFrom(next: string[], start: number, clean: string, length: number): DigitsUpdate {
  let i = start;
  for (const d of clean) {
    if (i >= length) break;
    next[i] = d;
    i += 1;
  }
  return { digits: next, focus: Math.min(i, length - 1) };
}

/** The code typed so far, or null while any box is empty. */
export function completeCode(digits: readonly string[]): string | null {
  const joined = digits.join("");
  return joined.length === digits.length && digits.every(Boolean) ? joined : null;
}
