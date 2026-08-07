import { NextResponse, type NextRequest } from "next/server";

import { deliveryIssueResponseSchema, updateDeliveryIssueStatusSchema } from "@/src/contracts/delivery-issue-schema";
import { UpdateDeliveryIssueStatus } from "@/src/domain/use-cases/delivery-issues/UpdateDeliveryIssueStatus";
import { deliveryIssueRepository } from "@/src/infrastructure/container";
import { errorResponse, errorResponseFromException, firstFieldErrors, parseJsonBody, unauthorizedResponse } from "@/src/lib/api/responses";
import { getSessionWith } from "@/src/lib/require-permission";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/** PATCH /api/admin/delivery-issues/:id — move an issue to a new status. Requires `orders.fulfill`. */
export async function PATCH(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  if (!(await getSessionWith("orders.fulfill"))) return unauthorizedResponse();
  const { id } = await params;

  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = updateDeliveryIssueStatusSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, { message: "Please fix the highlighted fields.", code: "VALIDATION", fieldErrors: firstFieldErrors(parsed.error) });
  }

  try {
    const issue = await new UpdateDeliveryIssueStatus(deliveryIssueRepository).execute(id, parsed.data.status);
    return NextResponse.json(deliveryIssueResponseSchema.parse(issue));
  } catch (error) {
    return errorResponseFromException(error, `PATCH /api/admin/delivery-issues/${id} failed`);
  }
}
