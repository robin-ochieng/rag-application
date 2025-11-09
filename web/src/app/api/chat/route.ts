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

type JsonObject = Record<string, unknown>;

function parseJson(response: Response): Promise<JsonObject> {
  return response.json().catch(() => ({} as JsonObject));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Unknown error";
}

export async function GET() {
  try {
    const r = await fetch(`${BASE}/healthz`, { cache: "no-store" });
    const data = await parseJson(r);
    return NextResponse.json({ ok: r.ok, backend: BASE, data }, { status: r.ok ? 200 : r.status });
  } catch (primaryError: unknown) {
    try {
      const r2 = await fetch(`${ALT}/healthz`, { cache: "no-store" });
      const data2 = await parseJson(r2);
      return NextResponse.json(
        { ok: r2.ok, backend: ALT, fallbackFrom: BASE, data: data2 },
        { status: r2.ok ? 200 : r2.status }
      );
    } catch (fallbackError: unknown) {
      const message = getErrorMessage(fallbackError) || getErrorMessage(primaryError);
      return NextResponse.json(
        { ok: false, backend: BASE, alt: ALT, error: message },
        { status: 500 }
      );
    }
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as JsonObject;
  try {
    const r = await fetch(`${BASE}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(API_KEY ? { "X-API-KEY": API_KEY } : {}) },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!r.ok) {
      return NextResponse.json({ error: await r.text(), backend: BASE }, { status: r.status });
    }
    return NextResponse.json(await parseJson(r));
  } catch (primaryError: unknown) {
    try {
      const r2 = await fetch(`${ALT}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(API_KEY ? { "X-API-KEY": API_KEY } : {}) },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      if (!r2.ok) {
        return NextResponse.json({ error: await r2.text(), backend: ALT, fallbackFrom: BASE }, { status: r2.status });
      }
      return NextResponse.json(await parseJson(r2));
    } catch (fallbackError: unknown) {
      const message = getErrorMessage(fallbackError) || getErrorMessage(primaryError);
      return NextResponse.json(
        { error: message, backend: BASE, altTried: ALT },
        { status: 500 }
      );
    }
  }
}
