import { NextResponse, type NextRequest } from "next/server";
import { GetPromoCodeById } from "@/src/domain/use-cases/promo-codes/GetPromoCodeById";
import { UpdatePromoCode } from "@/src/domain/use-cases/promo-codes/UpdatePromoCode";
import { SetPromoCodeActive } from "@/src/domain/use-cases/promo-codes/SetPromoCodeActive";
import { promoCodeRepository } from "@/src/infrastructure/container";
import { getSessionWith } from "@/src/lib/require-permission";
import {
  errorResponse,
  errorResponseFromException,
  firstFieldErrors,
  parseJsonBody,
  unauthorizedResponse,
} from "@/src/lib/api/responses";
import { promoCodeActiveSchema, promoCodeFormSchema } from "@/src/contracts/promo-code-schema";

// Looked up and written per request — never statically cached.
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/promo-codes/:id — one campaign with its window, switch and
 * redemption count, to prefill the edit form. Admin only (unlike the storefront's
 * public read, this answers with the operator-facing shape). 404 when it's gone.
 */
export async function GET(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  if (!(await getSessionWith("promotions.write"))) return unauthorizedResponse();

  const { id } = await params;
  try {
    const promo = await new GetPromoCodeById(promoCodeRepository).execute(id);
    if (!promo) return errorResponse(404, { message: "Promo code not found.", code: "NOT_FOUND" });
    return NextResponse.json(promo);
  } catch (error) {
    return errorResponseFromException(error, `GET /api/admin/promo-codes/${id} failed`);
  }
}

/** PUT /api/admin/promo-codes/:id — edit a campaign. Admin only. */
export async function PUT(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await getSessionWith("promotions.write");
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = promoCodeFormSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, {
      message: "Please fix the highlighted fields.",
      code: "VALIDATION",
      fieldErrors: firstFieldErrors(parsed.error),
    });
  }

  try {
    const updated = await new UpdatePromoCode(promoCodeRepository).execute(id, parsed.data, {
      id: session.user.id,
      name: session.user.name ?? session.user.id,
    });
    return NextResponse.json(updated);
  } catch (error) {
    return errorResponseFromException(error, `PUT /api/admin/promo-codes/${id} failed`);
  }
}

/**
 * PATCH /api/admin/promo-codes/:id — switch a campaign on or off. Admin only.
 *
 * There is no DELETE: a promo code is retired by deactivating it. The code is
 * already out in the world on cards and in inboxes, and orders were placed against
 * it — removing the row would strand both. See `SetPromoCodeActive`.
 */
export async function PATCH(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await getSessionWith("promotions.write");
  if (!session) return unauthorizedResponse();

  const { id } = await params;
  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = promoCodeActiveSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, {
      message: "Please fix the highlighted fields.",
      code: "VALIDATION",
      fieldErrors: firstFieldErrors(parsed.error),
    });
  }

  try {
    const updated = await new SetPromoCodeActive(promoCodeRepository).execute(
      id,
      parsed.data.active,
      { id: session.user.id, name: session.user.name ?? session.user.id },
    );
    return NextResponse.json(updated);
  } catch (error) {
    return errorResponseFromException(error, `PATCH /api/admin/promo-codes/${id} failed`);
  }
}
