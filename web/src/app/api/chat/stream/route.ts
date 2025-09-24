import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE = process.env.API_URL ?? "http://127.0.0.1:8000";
const ALT = BASE.includes("127.0.0.1")
  ? BASE.replace("127.0.0.1", "localhost")
  : BASE.includes("localhost")
  ? BASE.replace("localhost", "127.0.0.1")
  : "http://localhost:8000";
const API_KEY = process.env.BACKEND_API_KEY;

async function proxy(url: string, body: string) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(API_KEY ? { "X-API-KEY": API_KEY } : {}) },
    body,
    cache: "no-store",
  });
  return r;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  let resp = await proxy(`${BASE}/ask-stream`, body);
  if (!resp.ok || !resp.body) {
    try {
      const alt = await proxy(`${ALT}/ask-stream`, body);
      if (alt.ok && alt.body) resp = alt; else return new Response(await resp.text(), { status: resp.status });
    } catch {
      return new Response(await resp.text().catch(() => "stream error"), { status: resp.status });
    }
  }
  // Pass through SSE stream untouched
  return new Response(resp.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Backend": BASE,
    },
  });
}
