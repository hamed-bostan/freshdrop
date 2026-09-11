import { NextResponse, type NextRequest } from "next/server";

import { SweepExportJobs } from "@/src/domain/use-cases/exports/SweepExportJobs";
import { exportFileStorage, exportJobRepository } from "@/src/infrastructure/container";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";
import { isAuthorizedForCron } from "@/src/lib/cron-auth";

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
  if (!(await isAuthorizedForCron(request, "dashboard.view", process.env.EXPORT_SWEEP_SECRET))) {
    return unauthorizedResponse();
  }

  try {
    const result = await new SweepExportJobs(exportJobRepository, exportFileStorage).execute();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return errorResponseFromException(error, "Export sweep failed");
  }
}
