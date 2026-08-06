import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { SweepExportJobs } from "@/src/domain/use-cases/exports/SweepExportJobs";
import { exportFileStorage, exportJobRepository } from "@/src/infrastructure/container";
import { getSessionWith } from "@/src/lib/require-permission";

// Reads/writes fresh state on every call; never cache or statically analyse it.
export const dynamic = "force-dynamic";

/**
 * Export center housekeeping: `POST /api/admin/exports/sweep`. Expires
 * `ready` jobs past their 7-day download window (removing their storage
 * object) and recovers jobs stranded `processing` by a container restart —
 * see `SweepExportJobs`. Authorised by an admin session OR a cron bearer
 * secret, same shape as `customer-segments/snapshot`.
 *
 * Wire to a daily host cron on the VPS:
 *   curl -fsS -X POST -H "Authorization: Bearer $EXPORT_SWEEP_SECRET" \
 *     https://nearfood.ir/api/admin/exports/sweep
 */
export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  try {
    const result = await new SweepExportJobs(exportJobRepository, exportFileStorage).execute();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Export sweep failed:", error);
    return NextResponse.json({ error: "Export sweep failed." }, { status: 500 });
  }
}

/** Admins may run it on demand; automation uses the `EXPORT_SWEEP_SECRET` bearer. */
async function isAuthorized(request: NextRequest): Promise<boolean> {
  if (await getSessionWith("dashboard.view")) return true;

  const secret = process.env.EXPORT_SWEEP_SECRET;
  if (!secret) return false; // No secret configured → only an admin session is accepted.

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return constantTimeEquals(token, secret);
}

function constantTimeEquals(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}
