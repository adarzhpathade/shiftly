/**
 * Fake latency so loading states are visible in development.
 * Set MOCK_DELAY_SCALE=0 (tests) to skip waiting, or e.g. 2 to slow things down.
 */
function scale(): number {
  const raw = Number(process.env.MOCK_DELAY_SCALE ?? "1");
  return Number.isFinite(raw) && raw >= 0 ? raw : 1;
}

export function delay(minMs = 300, maxMs = 500): Promise<void> {
  const ms = (minMs + Math.random() * (maxMs - minMs)) * scale();
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Short pause between streamed tokens. */
export function tokenDelay(ms = 35): Promise<void> {
  const scaled = ms * scale();
  if (scaled <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, scaled));
}
