import { NextRequest } from "next/server";

export const runtime = "edge";

function resolveBackendBase(): string | null {
  const candidates = [
    process.env.NEXT_PUBLIC_BACKEND_URL,
    process.env.BACKEND_URL,
    process.env.API_URL,
    process.env.NEXT_PUBLIC_API_BASE,
  ];

  for (const candidate of candidates) {
    const value = typeof candidate === "string" ? candidate.trim() : "";
    if (!value) continue;
    if (value.startsWith("/")) continue;
    return value.replace(/\/$/, "");
  }
  return null;
}

function errorResponse(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-cache" },
  });
}

// Proxy to backend /ask-stream and pipe SSE through unchanged.
export async function POST(req: NextRequest) {
  const { q } = await req.json().catch(() => ({} as { q?: string }));
  if (!q) {
    return errorResponse("Missing question payload", 400);
  }

  const backendBase = resolveBackendBase();
  if (!backendBase) {
    return errorResponse("Backend URL not configured. Set NEXT_PUBLIC_BACKEND_URL or API_URL.");
  }

  const apiKey = process.env.NEXT_PUBLIC_BACKEND_API_KEY || process.env.BACKEND_API_KEY;

  const controller = new AbortController();
  req.signal.addEventListener("abort", () => controller.abort());

  const upstreamUrl = `${backendBase}/ask-stream`;

  let backendResp: Response;
  try {
    backendResp = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(apiKey ? { "X-API-KEY": apiKey } : {}),
      },
      body: JSON.stringify({ q }),
      signal: controller.signal,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reach backend";
    return errorResponse(`Failed to reach ${upstreamUrl}: ${message}`);
  }

  if (!backendResp.ok || !backendResp.body) {
    return errorResponse(`Upstream error ${backendResp.status}`, backendResp.status || 502);
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
