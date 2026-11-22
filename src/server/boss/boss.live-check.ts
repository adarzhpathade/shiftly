/**
 * Live check: runs ONE real Groq turn through runTurn with a sample persona.
 * Prints: provider, status, latency ms, outcome, mood, scores summary, OK/FAIL.
 * Never prints API keys. Exit code 1 on failure.
 */
import { runTurn } from "./engine";

async function main() {
  const samplePersona = {
    name: "Mr. Sharma",
    problem: "Third call about a Rs. 2,499 refund for a blender that arrived broken.",
    hiddenGoal: "Calm them down and get a confirmed refund reference number with a callback promise.",
    systemPrompt:
      "You are Mr. Sharma, a frustrated customer who has called three times about a broken blender refund.\nOPENING: This is my THIRD call about the refund. I want my money back today.",
  };

  const start = Date.now();

  try {
    const result = await runTurn({
      persona: samplePersona,
      mood: 25,
      turn: 1,
      maxTurns: 8,
      history: [{ role: "customer", text: "This is my THIRD call about the refund. I want my money back today." }],
      userText:
        "Mr. Sharma, I'm sorry this has happened three times. I will personally raise your refund right now and give you a reference number. I'll call you back by 5 pm to confirm.",
    });

    const latency = Date.now() - start;

    if (!result.ok) {
      console.log(`FAIL - both providers unavailable (latency: ${latency}ms)`);
      process.exit(1);
    }

    const { data } = result;
    const scoresSummary = `emp:${data.scores.empathy} own:${data.scores.ownership} clar:${data.scores.clarity} sol:${data.scores.solution} tone:${data.scores.tone}`;

    console.log(`OK`);
    console.log(`Provider:  ${data.provider}`);
    console.log(`Status:    ${data.outcome}`);
    console.log(`Latency:   ${latency}ms`);
    console.log(`Mood:      ${data.mood}`);
    console.log(`Scores:    ${scoresSummary}`);
  } catch (err) {
    const latency = Date.now() - start;
    console.log(`FAIL - error after ${latency}ms: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
