import { NextResponse, type NextRequest } from "next/server";
import { GetPaymentReport } from "@/src/domain/use-cases/analytics/GetPaymentReport";
import { analyticsRepository } from "@/src/infrastructure/container";
import { parseAnalyticsRange } from "@/src/lib/api/analytics-params";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";
import { getSessionWith } from "@/src/lib/require-permission";

export const dynamic = "force-dynamic";

/** Payment aggregates for one URL-defined period and its adjacent baseline. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!(await getSessionWith("dashboard.view"))) return unauthorizedResponse();

  try {
    const report = await new GetPaymentReport(analyticsRepository).execute(
      parseAnalyticsRange(request.nextUrl.searchParams),
    );
    return NextResponse.json(report);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/payment-report failed");
  }
}
