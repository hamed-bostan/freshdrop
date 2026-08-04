import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { SnapshotCustomerSegments } from "@/src/domain/use-cases/analytics/SnapshotCustomerSegments";
import { analyticsRepository, customerSegmentSnapshotRepository } from "@/src/infrastructure/container";
import { getSessionWith } from "@/src/lib/require-permission";

// Reads/writes fresh state on every call; never cache or statically analyse it.
export const dynamic = "force-dynamic";

/**
 * Daily customer-segment snapshot: `POST /api/admin/customer-segments/snapshot`.
 * Classifies every customer against the trailing 30 days ending now and appends
 * one row per customer to `CustomerSegmentSnapshot` — the history
 * `customerSegmentTransitions` reads. Authorised by an admin session OR a cron
 * bearer secret. Idempotent for a day already captured.
 *
 * Wire to a host cron on the VPS, e.g. (daily):
 *   curl -fsS -X POST -H "Authorization: Bearer $CUSTOMER_SEGMENT_SNAPSHOT_SECRET" \
 *     https://nearfood.ir/api/admin/customer-segments/snapshot
 */
export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  try {
    const result = await new SnapshotCustomerSegments(analyticsRepository, customerSegmentSnapshotRepository).execute();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Customer segment snapshot failed:", error);
    return NextResponse.json({ error: "Customer segment snapshot failed." }, { status: 500 });
  }
}

/** Admins may run it on demand; automation uses the `CUSTOMER_SEGMENT_SNAPSHOT_SECRET` bearer. */
async function isAuthorized(request: NextRequest): Promise<boolean> {
  if (await getSessionWith("dashboard.view")) return true;

  const secret = process.env.CUSTOMER_SEGMENT_SNAPSHOT_SECRET;
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
