/** Returns "real" only when AI_MODE === "real", else "mock". */
export function getAiMode(): "real" | "mock" {
  return process.env.AI_MODE === "real" ? "real" : "mock";
}
