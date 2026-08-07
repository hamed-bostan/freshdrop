import { NextResponse, type NextRequest } from "next/server";

import { createDeliveryIssueSchema, deliveryIssueListResponseSchema, deliveryIssueResponseSchema } from "@/src/contracts/delivery-issue-schema";
import { CreateDeliveryIssue } from "@/src/domain/use-cases/delivery-issues/CreateDeliveryIssue";
import { ListOrderDeliveryIssues } from "@/src/domain/use-cases/delivery-issues/ListOrderDeliveryIssues";
import { deliveryIssueRepository } from "@/src/infrastructure/container";
import { errorResponse, errorResponseFromException, firstFieldErrors, parseJsonBody, unauthorizedResponse } from "@/src/lib/api/responses";
import { getSessionWith } from "@/src/lib/require-permission";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/admin/orders/:id/delivery-issues — one order's logged issues, newest first. Same gate as reading the order and its notes. */
export async function GET(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  if (!(await getSessionWith("dashboard.view"))) return unauthorizedResponse();
  const { id } = await params;
  try {
    const issues = await new ListOrderDeliveryIssues(deliveryIssueRepository).execute(id);
    return NextResponse.json(deliveryIssueListResponseSchema.parse(issues));
  } catch (error) {
    return errorResponseFromException(error, `GET /api/admin/orders/${id}/delivery-issues failed`);
  }
}

/** POST /api/admin/orders/:id/delivery-issues — log an issue. Requires `orders.fulfill`, same as other operational writes on an order. */
export async function POST(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  if (!(await getSessionWith("orders.fulfill"))) return unauthorizedResponse();
  const { id } = await params;

  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = createDeliveryIssueSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, { message: "Please fix the highlighted fields.", code: "VALIDATION", fieldErrors: firstFieldErrors(parsed.error) });
  }

  try {
    const issue = await new CreateDeliveryIssue(deliveryIssueRepository).execute(id, parsed.data.type, parsed.data.delayMinutes);
    return NextResponse.json(deliveryIssueResponseSchema.parse(issue), { status: 201 });
  } catch (error) {
    return errorResponseFromException(error, `POST /api/admin/orders/${id}/delivery-issues failed`);
  }
}
