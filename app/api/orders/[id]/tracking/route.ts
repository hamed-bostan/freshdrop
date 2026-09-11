import { NextResponse, type NextRequest } from "next/server";

import { orderTrackingStageSchema } from "@/src/contracts/order-tracking-schema";
import { GetOrderTracking } from "@/src/domain/use-cases/orders/GetOrderTracking";
import { SetOrderTrackingStage } from "@/src/domain/use-cases/orders/SetOrderTrackingStage";
import {
  orderRepository,
  orderTrackingRepository,
  orderNotifier,
} from "@/src/infrastructure/container";
import {
  errorResponse,
  errorResponseFromException,
  firstFieldErrors,
  parseJsonBody,
  unauthorizedResponse,
} from "@/src/lib/api/responses";
import { getUserSession } from "@/src/lib/require-auth";
import { getSessionWith, sessionHas } from "@/src/lib/require-permission";

// Per-user data, read per request — never statically cached.
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/orders/:id/tracking — live delivery tracking for one order.
 *
 * Auth required, and scoped to the order's owner (admins may view any order):
 * tracking is user data. 404 when the order can't be tracked (unknown id,
 * archived, cancelled, or not the caller's) so the caller can `notFound()` —
 * and so another user's order isn't leaked as "exists but forbidden".
 */
export async function GET(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await getUserSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  try {
    // Reading any order's tracking is a dashboard read, so it's `dashboard.view`
    // rather than the fulfilment permission the `PUT` below needs — support can
    // look up where a delivery is without being able to move it.
    const viewer = {
      userId: session.user.id,
      canViewAnyOrder: await sessionHas(session, "dashboard.view"),
    };
    const tracking = await new GetOrderTracking(orderTrackingRepository).execute(id, viewer);
    if (!tracking) return errorResponse(404, { message: "This order can't be tracked.", code: "NOT_FOUND" });
    return NextResponse.json(tracking);
  } catch (error) {
    return errorResponseFromException(error, `GET /api/orders/${id}/tracking failed`);
  }
}

/**
 * PUT /api/orders/:id/tracking — advance the order's delivery stage. Admin only.
 *
 * Thin controller: authenticate → validate (same Zod schema the dashboard uses) →
 * delegate to the use-case → return the updated tracking. The use-case maps an
 * unknown id to 404 and an untrackable order to 400.
 */
export async function PUT(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await getSessionWith("orders.fulfill");
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = orderTrackingStageSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, {
      message: "Please pick a valid delivery stage.",
      code: "VALIDATION",
      fieldErrors: firstFieldErrors(parsed.error),
    });
  }

  try {
    await new SetOrderTrackingStage(orderRepository, orderNotifier).execute(
      id,
      parsed.data.stage,
      { id: session.user.id, name: session.user.name ?? session.user.id },
    );
    const tracking = await new GetOrderTracking(orderTrackingRepository).execute(id, {
      userId: session.user.id,
      canViewAnyOrder: true,
    });
    return NextResponse.json(tracking);
  } catch (error) {
    return errorResponseFromException(error, `PUT /api/orders/${id}/tracking failed`);
  }
}
