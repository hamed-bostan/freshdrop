import { NextResponse, type NextRequest } from "next/server";
import { GetAnalyticsOverview } from "@/src/domain/use-cases/analytics/GetAnalyticsOverview";
import { analyticsRepository } from "@/src/infrastructure/container";
import { getSessionWith } from "@/src/lib/require-permission";
import { parseAnalyticsRange, parseRevenueRankSort } from "@/src/lib/api/analytics-params";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";

// Aggregates over a period that usually ends "now" — a cached answer here is a
// dashboard that has quietly stopped counting today's orders.
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/analytics — everything the dashboard overview renders for one
 * period, plus the equally-long period before it to compare against. Admin only.
 *
 * Query params: `range` (a preset: `7d`, `30d`, `90d`, `12m`) or `from` + `to`
 * (`YYYY-MM-DD`, inclusive of both days); `productSort`/`categorySort` (`revenue`
 * or `units`) for the two ranked panels. Anything unrecognised falls back to the
 * default preset or sort, the rule every list endpoint here follows.
 *
 * One endpoint for the whole screen, not one per tile: every figure has to describe
 * the same period, and independent fetches are independent chances for the range to
 * drift or for one to fail and leave the page half-answering the question. The
 * queries behind it still run in parallel — see `GetAnalyticsOverview`.
 *
 * Nothing here reads a row of the order history. The response is a few dozen
 * numbers computed in PostgreSQL; the old overview's `GET /api/admin/orders/all`
 * shipped every order and its items so the screen could reduce four of them.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!(await getSessionWith("dashboard.view"))) return unauthorizedResponse();

  const params = request.nextUrl.searchParams;
  const range = parseAnalyticsRange(params);
  const productsSort = parseRevenueRankSort(params, "productSort");
  const categoriesSort = parseRevenueRankSort(params, "categorySort");

  try {
    const overview = await new GetAnalyticsOverview(analyticsRepository).execute(range, {
      productsSort,
      categoriesSort,
    });
    return NextResponse.json(overview);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/analytics failed");
  }
}
