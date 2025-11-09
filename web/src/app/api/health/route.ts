import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HealthPayload = Record<string, unknown>;

function parseJson(response: Response): Promise<HealthPayload> {
  return response.json().catch(() => ({} as HealthPayload));
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
  const backend = process.env.API_URL || "http://127.0.0.1:8000";
  const alt = backend.includes("127.0.0.1")
    ? backend.replace("127.0.0.1", "localhost")
    : backend.includes("localhost")
    ? backend.replace("localhost", "127.0.0.1")
    : "http://localhost:8000";
  try {
    const res = await fetch(`${backend}/healthz`, { cache: "no-store" });
    const data = await parseJson(res);
    return NextResponse.json({ ok: res.ok, backend, data }, { status: res.ok ? 200 : res.status });
  } catch (primaryError: unknown) {
    try {
      const res2 = await fetch(`${alt}/healthz`, { cache: "no-store" });
      const data2 = await parseJson(res2);
      return NextResponse.json(
        { ok: res2.ok, backend: alt, fallbackFrom: backend, data: data2 },
        { status: res2.ok ? 200 : res2.status }
      );
    } catch (fallbackError: unknown) {
      const message = getErrorMessage(fallbackError) || getErrorMessage(primaryError);
      return NextResponse.json({ ok: false, error: message, backend, alt }, { status: 500 });
    }
  }
}
