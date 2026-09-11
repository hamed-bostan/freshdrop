import { NextResponse } from "next/server";

import { GetOrderPipelineCounts } from "@/src/domain/use-cases/orders/GetOrderPipelineCounts";
import { analyticsRepository } from "@/src/infrastructure/container";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";
import { getSessionWith } from "@/src/lib/require-permission";

// Counts the queue as it is per request — never statically cached.
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/orders/counts — how many orders sit at each pipeline stage, and
 * how many there are in total. Feeds the order list's summary cards and the counts
 * beside its status filter options.
 *
 * Unfiltered on purpose, and it takes no query params to say otherwise. These
 * numbers are the *entry points* into the list — "24 pending" is a claim about the
 * store, not about whatever the current view happens to be narrowed to. Counts
 * that moved with the filters would make the cards a summary of the answer rather
 * than a route to it, and clicking "24" after a date filter had quietly reduced it
 * to 24-of-this-week is a number nobody can act on.
 */
export async function GET(): Promise<NextResponse> {
  if (!(await getSessionWith("dashboard.view"))) return unauthorizedResponse();

  try {
    const counts = await new GetOrderPipelineCounts(analyticsRepository).execute();
    return NextResponse.json(counts);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/orders/counts failed");
  }
}
