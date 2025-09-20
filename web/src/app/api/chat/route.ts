import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE = process.env.API_URL ?? "http://127.0.0.1:8000"; // dev default
const ALT = BASE.includes("127.0.0.1")
  ? BASE.replace("127.0.0.1", "localhost")
  : BASE.includes("localhost")
  ? BASE.replace("localhost", "127.0.0.1")
  : "http://localhost:8000";
const API_KEY = process.env.BACKEND_API_KEY;

export async function GET() {
  try {
    const r = await fetch(`${BASE}/healthz`, { cache: "no-store" });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json({ ok: r.ok, backend: BASE, data }, { status: r.ok ? 200 : r.status });
  } catch (e1: any) {
    try {
      const r2 = await fetch(`${ALT}/healthz`, { cache: "no-store" });
      const data2 = await r2.json().catch(() => ({}));
      return NextResponse.json(
        { ok: r2.ok, backend: ALT, fallbackFrom: BASE, data: data2 },
        { status: r2.ok ? 200 : r2.status }
      );
    } catch (e2: any) {
      return NextResponse.json(
        { ok: false, backend: BASE, alt: ALT, error: e2?.message || e1?.message || String(e2) },
        { status: 500 }
      );
    }
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  try {
    const r = await fetch(`${BASE}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(API_KEY ? { "X-API-KEY": API_KEY } : {}) },
      body: JSON.stringify(body),
      cache: "no-store",
      // @ts-ignore – ensure no Next caching
      next: { revalidate: 0 },
    });
    if (!r.ok) return NextResponse.json({ error: await r.text(), backend: BASE }, { status: r.status });
    return NextResponse.json(await r.json());
  } catch (e1: any) {
    try {
      const r2 = await fetch(`${ALT}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(API_KEY ? { "X-API-KEY": API_KEY } : {}) },
        body: JSON.stringify(body),
        cache: "no-store",
        // @ts-ignore
        next: { revalidate: 0 },
      });
      if (!r2.ok) return NextResponse.json({ error: await r2.text(), backend: ALT, fallbackFrom: BASE }, { status: r2.status });
      return NextResponse.json(await r2.json());
    } catch (e2: any) {
      return NextResponse.json(
        { error: e2?.message ?? e1?.message ?? "proxy error", backend: BASE, altTried: ALT },
        { status: 500 }
      );
    }
  }
}
