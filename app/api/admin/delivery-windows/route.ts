import { NextResponse, type NextRequest } from "next/server";
import { GetDeliveryWindows } from "@/src/domain/use-cases/delivery-slots/GetDeliveryWindows";
import { CreateDeliveryWindow } from "@/src/domain/use-cases/delivery-slots/CreateDeliveryWindow";
import { deliverySlotRepository } from "@/src/infrastructure/container";
import { getSessionWith } from "@/src/lib/require-permission";
import {
  errorResponse,
  errorResponseFromException,
  firstFieldErrors,
  parseJsonBody,
  unauthorizedResponse,
} from "@/src/lib/api/responses";
import { newDeliveryWindowSchema } from "@/src/contracts/delivery-window-schema";

// Reads and writes the window catalog per request — never statically cached.
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/delivery-windows — the recurring window catalog, in display
 * order. Admin only.
 *
 * Unpaged, unlike the other admin lists: this is a short, fixed reference catalog
 * (Morning, Midday, Evening…) that an operator orders by hand, the same shape as
 * the payment methods. Paging a list you arrange by position would put the thing
 * you're arranging on two screens.
 *
 * Distinct from the public `GET /api/delivery-slots`, which projects these windows
 * across the booking horizon into dated slots with live availability. This is the
 * definition an operator edits; that is the schedule it produces.
 */
export async function GET(): Promise<NextResponse> {
  const session = await getSessionWith("promotions.write");
  if (!session) return unauthorizedResponse();

  try {
    const windows = await new GetDeliveryWindows(deliverySlotRepository).execute();
    return NextResponse.json(windows);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/delivery-windows failed");
  }
}

/**
 * POST /api/admin/delivery-windows — add a window to the catalog. Admin only.
 *
 * Thin controller: authenticate → validate (the same Zod schema the form uses) →
 * delegate to the use-case → map domain errors to HTTP status codes.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWith("promotions.write");
  if (!session) return unauthorizedResponse();

  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = newDeliveryWindowSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, {
      message: "Please fix the highlighted fields.",
      code: "VALIDATION",
      fieldErrors: firstFieldErrors(parsed.error),
    });
  }

  try {
    const created = await new CreateDeliveryWindow(deliverySlotRepository).execute(parsed.data, { id: session.user.id, name: session.user.name ?? session.user.id });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return errorResponseFromException(error, "POST /api/admin/delivery-windows failed");
  }
}
