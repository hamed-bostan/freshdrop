import { NextResponse, type NextRequest } from "next/server";
import { GetDeliveryWindowById } from "@/src/domain/use-cases/delivery-slots/GetDeliveryWindowById";
import { UpdateDeliveryWindow } from "@/src/domain/use-cases/delivery-slots/UpdateDeliveryWindow";
import { DeleteDeliveryWindow } from "@/src/domain/use-cases/delivery-slots/DeleteDeliveryWindow";
import { activityLog, deliverySlotRepository } from "@/src/infrastructure/container";
import { getAdminSession } from "@/src/lib/require-admin";
import {
  errorResponse,
  errorResponseFromException,
  firstFieldErrors,
  parseJsonBody,
  unauthorizedResponse,
} from "@/src/lib/api/responses";
import { deliveryWindowFormSchema } from "@/src/contracts/delivery-window-schema";

// Looked up and written per request — never statically cached.
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/admin/delivery-windows/:id — one window, to prefill the edit form. Admin only. */
export async function GET(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  try {
    const window = await new GetDeliveryWindowById(deliverySlotRepository).execute(id);
    if (!window) return errorResponse(404, { message: "Delivery window not found.", code: "NOT_FOUND" });
    return NextResponse.json(window);
  } catch (error) {
    return errorResponseFromException(error, `GET /api/admin/delivery-windows/${id} failed`);
  }
}

/**
 * PUT /api/admin/delivery-windows/:id — edit a window's hours, capacity or order.
 * Admin only. The id isn't in the body: it's the slug the booking ledger and every
 * order that booked this window reference, and it's immutable after creation.
 */
export async function PUT(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = deliveryWindowFormSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, {
      message: "Please fix the highlighted fields.",
      code: "VALIDATION",
      fieldErrors: firstFieldErrors(parsed.error),
    });
  }

  try {
    const updated = await new UpdateDeliveryWindow(deliverySlotRepository, activityLog).execute(
      id,
      parsed.data,
      { id: session.user.id, name: session.user.name ?? session.user.id },
    );
    return NextResponse.json(updated);
  } catch (error) {
    return errorResponseFromException(error, `PUT /api/admin/delivery-windows/${id} failed`);
  }
}

/**
 * DELETE /api/admin/delivery-windows/:id — remove a window. Admin only. 204 on
 * success; 409 while orders are still booked into it (see `DeleteDeliveryWindow`).
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  try {
    await new DeleteDeliveryWindow(deliverySlotRepository, activityLog).execute(id, { id: session.user.id, name: session.user.name ?? session.user.id });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponseFromException(error, `DELETE /api/admin/delivery-windows/${id} failed`);
  }
}
