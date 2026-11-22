import { z } from "zod";
import { bossRepo } from "@/data";
import { requireViewer } from "@/server/auth/session";
import type { NextRequest } from "next/server";


const BodySchema = z.object({
  text: z.string().min(1),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ sessionId: string }> },
) {
  // Auth
  let viewer: Awaited<ReturnType<typeof requireViewer>>;
  try {
    viewer = await requireViewer();
  } catch {
    return Response.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // Params
  const { sessionId } = await context.params;

  // Body
  let text: string;
  try {
    const body = (await req.json()) as unknown;
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }
    text = parsed.data.text;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Stream response
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of bossRepo.sendMessage(viewer.id, sessionId, text)) {
          const line = JSON.stringify(event) + "\n";
          controller.enqueue(encoder.encode(line));
        }
      } catch (err) {
        const errorEvent = {
          type: "error",
          message: err instanceof Error ? err.message : "Internal server error",
          fallback: false,
        };
        controller.enqueue(encoder.encode(JSON.stringify(errorEvent) + "\n"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
