import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isSubpath(parent: string, child: string) {
  const rel = path.relative(parent, child);
  return !!rel && !rel.startsWith("..") && !path.isAbsolute(rel);
}

export async function GET(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const src = url.searchParams.get("src") || "";
    if (!src) return new Response("missing src", { status: 400 });

    // Normalize separators and strip leading slashes
    const norm = src.replace(/\\/g, "/").replace(/^\/+/, "");

    // Allowlist roots: projectRoot/data/documents and projectRoot/www
    const webDir = process.cwd();
    const projectRoot = path.resolve(webDir, "..");
    const dataRoot = path.join(projectRoot, "data", "documents");
    const wwwRoot = path.join(projectRoot, "www");

    const candidate = path.resolve(projectRoot, norm);
    const allowed = isSubpath(dataRoot, candidate) || isSubpath(wwwRoot, candidate);
    if (!allowed) return new Response("forbidden", { status: 403 });

    const buf = await fs.readFile(candidate);
    const u8 = new Uint8Array(buf.byteLength);
    u8.set(buf);
    const blob = new Blob([u8], { type: "application/pdf" });
    return new Response(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return new Response(String(e?.message || e), { status: 500 });
  }
}
