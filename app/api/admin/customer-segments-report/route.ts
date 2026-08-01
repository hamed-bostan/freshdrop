import { NextResponse, type NextRequest } from "next/server";
import { GetCustomerSegmentsReport } from "@/src/domain/use-cases/analytics/GetCustomerSegmentsReport";
import { analyticsRepository } from "@/src/infrastructure/container";
import { parseAnalyticsRange } from "@/src/lib/api/analytics-params";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";
import { getSessionWith } from "@/src/lib/require-permission";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!(await getSessionWith("dashboard.view"))) return unauthorizedResponse();
  try { return NextResponse.json(await new GetCustomerSegmentsReport(analyticsRepository).execute(parseAnalyticsRange(request.nextUrl.searchParams))); }
  catch (error) { return errorResponseFromException(error, "GET /api/admin/customer-segments-report failed"); }
}
