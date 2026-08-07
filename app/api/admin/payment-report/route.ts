import { NextResponse, type NextRequest } from "next/server";

import { GetPaymentReport } from "@/src/domain/use-cases/analytics/GetPaymentReport";
import { analyticsRepository } from "@/src/infrastructure/container";
import { parseAnalyticsRange, parseComparisonRange } from "@/src/lib/api/analytics-params";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";
import { getSessionWith } from "@/src/lib/require-permission";

export const dynamic = "force-dynamic";

/** Payment aggregates for one URL-defined period and its baseline (see `compare`). */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!(await getSessionWith("dashboard.view"))) return unauthorizedResponse();

  try {
    const range = parseAnalyticsRange(request.nextUrl.searchParams);
    const comparisonRange = parseComparisonRange(request.nextUrl.searchParams, range);
    const report = await new GetPaymentReport(analyticsRepository).execute(range, comparisonRange);
    return NextResponse.json(report);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/payment-report failed");
  }
}
