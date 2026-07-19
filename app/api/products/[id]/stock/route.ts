import { NextResponse, type NextRequest } from "next/server";
import { AdjustStock } from "@/src/domain/use-cases/products/AdjustStock";
import { GetStockMovements } from "@/src/domain/use-cases/products/GetStockMovements";
import {
  activityLog,
  productRepository,
  stockAlertNotifier,
  stockAlertRepository,
  stockMovementLog,
  userRepository,
} from "@/src/infrastructure/container";
import { getAdminSession } from "@/src/lib/require-admin";
import { stockAdjustmentSchema } from "@/src/contracts/stock-adjustment-schema";
import {
  errorResponse,
  errorResponseFromException,
  firstFieldErrors,
  parseJsonBody,
  unauthorizedResponse,
} from "@/src/lib/api/responses";

// Stock is read and written per request — never statically cached.
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/products/:id/stock — the product's recent stock movements, newest
 * first. Admin only: the ledger names who moved what, which is operator
 * information, not something the storefront's stock badge needs.
 *
 * `?limit` caps the entries (clamped by the use-case).
 */
export async function GET(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  if (!(await getAdminSession())) return unauthorizedResponse();

  const { id } = await params;
  // Absent stays `undefined` so the use-case applies its default. `Number(null)`
  // is 0, which the clamp would floor to a single entry — a one-row history.
  const rawLimit = request.nextUrl.searchParams.get("limit");
  const limit = rawLimit === null ? undefined : Number(rawLimit);

  try {
    const movements = await new GetStockMovements(stockMovementLog).execute(id, limit);
    return NextResponse.json(movements);
  } catch (error) {
    return errorResponseFromException(error, `GET /api/products/${id}/stock failed`);
  }
}

/**
 * PATCH /api/products/:id/stock — move one product's stock by a signed delta,
 * with a reason. Admin only.
 *
 * Deliberately narrow, and deliberately not `PUT /api/products/:id`: adjusting a
 * level from the catalog list would otherwise mean sending an entire product the
 * operator isn't editing, which both re-validates fields nobody touched and
 * quietly overwrites any change someone else saved in between. It's also a PATCH
 * on a *sub-resource* rather than the product, because the request body describes
 * a movement ("+12, restock"), not a new value for a field.
 */
export async function PATCH(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = stockAdjustmentSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, {
      message: "Please fix the highlighted fields.",
      code: "VALIDATION",
      fieldErrors: firstFieldErrors(parsed.error),
    });
  }

  try {
    const updated = await new AdjustStock(
      productRepository,
      userRepository,
      stockAlertRepository,
      stockAlertNotifier,
      activityLog,
    ).execute({
      productId: id,
      ...parsed.data,
      // The actor comes from the session, never from the body — otherwise the
      // ledger would record whoever the client claimed to be.
      actorId: session.user.id,
    });
    return NextResponse.json(updated);
  } catch (error) {
    return errorResponseFromException(error, `PATCH /api/products/${id}/stock failed`);
  }
}
