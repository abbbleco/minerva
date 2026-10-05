import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Liveness plus a self-check on the object source.
 *
 * Reports which driver resolved and whether it answers, so a deploy that comes
 * up with no MINERVA_ASSETS_* configured is visibly unhealthy instead of serving
 * 502s to every install.
 */
export async function GET() {
  try {
    const { createStorage } = await import("@/lib/storage");
    const storage = createStorage();

    // A cheap, always-present probe key: the app never invents a default
    // channel, so this asks about a key that legitimately may be absent and
    // treats 404 as "the source works".
    const probe = await storage.get("releases/.healthcheck", "HEAD");

    return NextResponse.json(
      { status: "ok", storage: storage.name, probe: probe === null ? "absent" : "present" },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 503, headers: { "cache-control": "no-store" } }
    );
  }
}
