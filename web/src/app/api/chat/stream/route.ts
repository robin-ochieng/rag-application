import { NextRequest } from "next/server";

export const runtime = "edge";

// Proxy to backend /ask-stream and pipe SSE through unchanged.
export async function POST(req: NextRequest) {
  const { q } = await req.json();
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  const apiKey = process.env.NEXT_PUBLIC_BACKEND_API_KEY;

  const controller = new AbortController();
  req.signal.addEventListener("abort", () => controller.abort());

  const backendResp = await fetch(`${backendBase}/ask-stream`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(apiKey ? { "X-API-KEY": apiKey } : {}),
    },
    body: JSON.stringify({ q }),
    signal: controller.signal,
  });

  if (!backendResp.ok || !backendResp.body) {
    return new Response(JSON.stringify({ error: `Upstream error ${backendResp.status}` }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const reader = backendResp.body.getReader();

  (async () => {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) await writer.write(value);
      }
    } catch (e) {
      console.error("Proxy stream error", e);
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    status: 200,
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
