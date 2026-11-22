const HINTS: Record<string, string> = {
  "handling-complaints": "calm them down, own the problem and promise a clear follow-up.",
  "customer-queries": "answer clearly, check they understood and leave them confident.",
  "difficult-customers": "stay calm, set a polite boundary and still find a way forward.",
  "problem-solving": "find the real cause, offer a fix and agree the next step.",
};

/** Hint shown on the boss intro. The real goal stays hidden from the learner. */
export function goalHintFor(categoryKey: string): string {
  return HINTS[categoryKey] ?? "turn the call around with empathy and a clear next step.";
}
