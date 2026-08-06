import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { RunDueSchedules } from "@/src/domain/use-cases/exports/RunDueSchedules";
import {
  analyticsRepository,
  emailSender,
  exportFileStorage,
  exportJobRepository,
  orderRepository,
  productRepository,
  scheduledExportRepository,
  stockMovementLog,
  userRepository,
} from "@/src/infrastructure/container";
import { getSessionWith } from "@/src/lib/require-permission";

// Reads/writes fresh state on every call; never cache or statically analyse it.
export const dynamic = "force-dynamic";

/**
 * The scheduler's tick: `POST /api/admin/exports/schedules/run`. Turns every
 * due schedule into a fresh `ExportJob` and advances it to its next
 * occurrence — see `RunDueSchedules`. Authorised by an admin session OR a
 * cron bearer secret, same shape as `exports/sweep` and
 * `customer-segments/snapshot`.
 *
 * Wire to an hourly host cron on the VPS:
 *   curl -fsS -X POST -H "Authorization: Bearer $EXPORT_SCHEDULE_SECRET" \
 *     https://nearfood.ir/api/admin/exports/schedules/run
 */
export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  try {
    const result = await new RunDueSchedules({
      schedules: scheduledExportRepository,
      jobs: exportJobRepository,
      storage: exportFileStorage,
      orders: orderRepository,
      users: userRepository,
      products: productRepository,
      movements: stockMovementLog,
      analytics: analyticsRepository,
      emailSender,
    }).execute();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Scheduled export run failed:", error);
    return NextResponse.json({ error: "Scheduled export run failed." }, { status: 500 });
  }
}

/** Admins may run it on demand; automation uses the `EXPORT_SCHEDULE_SECRET` bearer. */
async function isAuthorized(request: NextRequest): Promise<boolean> {
  if (await getSessionWith("dashboard.view")) return true;

  const secret = process.env.EXPORT_SCHEDULE_SECRET;
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
