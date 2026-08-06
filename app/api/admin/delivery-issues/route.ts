import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { deliveryIssueListResponseSchema } from "@/src/contracts/delivery-issue-schema";
import { DELIVERY_ISSUE_STATUSES } from "@/src/domain/entities/DeliveryIssue";
import { ListDeliveryIssuesReport } from "@/src/domain/use-cases/delivery-issues/ListDeliveryIssuesReport";
import { deliveryIssueRepository } from "@/src/infrastructure/container";
import { parseAnalyticsRange } from "@/src/lib/api/analytics-params";
import { errorResponse, errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";
import { getSessionWith } from "@/src/lib/require-permission";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 5;
const querySchema = z.object({ status: z.enum(DELIVERY_ISSUE_STATUSES).optional(), q: z.string().optional(), limit: z.coerce.number().int().positive().optional() });

/** GET /api/admin/delivery-issues — issues logged in a reporting period, newest first, narrowed by `?status=` / `?q=` — the delivery report's Issues & incidents panel. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!(await getSessionWith("dashboard.view"))) return unauthorizedResponse();

  const params = request.nextUrl.searchParams;
  const parsedQuery = querySchema.safeParse({ status: params.get("status") ?? undefined, q: params.get("q") ?? undefined, limit: params.get("limit") ?? undefined });
  if (!parsedQuery.success) return errorResponse(400, { message: "Invalid query parameters.", code: "BAD_REQUEST" });

  try {
    const range = parseAnalyticsRange(params);
    const issues = await new ListDeliveryIssuesReport(deliveryIssueRepository).execute(
      range,
      { status: parsedQuery.data.status, search: parsedQuery.data.q },
      parsedQuery.data.limit ?? DEFAULT_LIMIT,
    );
    return NextResponse.json(deliveryIssueListResponseSchema.parse(issues));
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/delivery-issues failed");
  }
}
