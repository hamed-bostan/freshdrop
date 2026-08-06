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
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";
import { isAuthorizedForCron } from "@/src/lib/cron-auth";

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
  if (!(await isAuthorizedForCron(request, "dashboard.view", process.env.EXPORT_SCHEDULE_SECRET))) {
    return unauthorizedResponse();
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
    return errorResponseFromException(error, "Scheduled export run failed");
  }
}

