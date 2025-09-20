import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const backend = process.env.API_URL || "http://127.0.0.1:8000";
  const alt = backend.includes("127.0.0.1")
    ? backend.replace("127.0.0.1", "localhost")
    : backend.includes("localhost")
    ? backend.replace("localhost", "127.0.0.1")
    : "http://localhost:8000";
  try {
    const res = await fetch(`${backend}/healthz`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ ok: res.ok, backend, data }, { status: res.ok ? 200 : res.status });
  } catch (e1: any) {
    try {
      const res2 = await fetch(`${alt}/healthz`, { cache: "no-store" });
      const data2 = await res2.json().catch(() => ({}));
      return NextResponse.json(
        { ok: res2.ok, backend: alt, fallbackFrom: backend, data: data2 },
        { status: res2.ok ? 200 : res2.status }
      );
    } catch (e2: any) {
      return NextResponse.json({ ok: false, error: e2?.message || e1?.message || String(e2), backend, alt }, { status: 500 });
    }
  }
}
