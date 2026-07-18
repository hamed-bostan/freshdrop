import { NextResponse, type NextRequest } from "next/server";
import { GetOrderTracking } from "@/src/domain/use-cases/orders/GetOrderTracking";
import { SetOrderTrackingStage } from "@/src/domain/use-cases/orders/SetOrderTrackingStage";
import { orderRepository, orderTrackingRepository, orderNotifier } from "@/src/infrastructure/container";
import { getAdminSession, isAdmin } from "@/src/lib/require-admin";
import { getUserSession } from "@/src/lib/require-auth";
import { orderTrackingStageSchema } from "@/src/presentation/dashboard/orders/order-tracking-schema";
import {
  errorResponse,
  errorResponseFromException,
  firstFieldErrors,
  parseJsonBody,
  unauthorizedResponse,
} from "@/src/lib/api/responses";

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
    const viewer = { userId: session.user.id, isAdmin: await isAdmin(session) };
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
  const session = await getAdminSession();
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
    await new SetOrderTrackingStage(orderRepository, orderNotifier).execute(id, parsed.data.stage);
    const tracking = await new GetOrderTracking(orderTrackingRepository).execute(id, {
      userId: session.user.id,
      isAdmin: true,
    });
    return NextResponse.json(tracking);
  } catch (error) {
    return errorResponseFromException(error, `PUT /api/orders/${id}/tracking failed`);
  }
}
