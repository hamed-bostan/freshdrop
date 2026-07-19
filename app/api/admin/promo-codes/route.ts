import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_PROMO_CODE_SORTS,
  DEFAULT_ADMIN_PROMO_CODE_DIRECTION,
  DEFAULT_ADMIN_PROMO_CODE_SORT,
} from "@/src/domain/entities/PromoCode";
import { ListPromoCodes } from "@/src/domain/use-cases/promo-codes/ListPromoCodes";
import { CreatePromoCode } from "@/src/domain/use-cases/promo-codes/CreatePromoCode";
import { activityLog, promoCodeRepository } from "@/src/infrastructure/container";
import { getAdminSession } from "@/src/lib/require-admin";
import { parseAdminPromoCodeFilters } from "@/src/lib/api/admin-promo-code-params";
import { parsePageRequest } from "@/src/lib/api/pagination-params";
import {
  errorResponse,
  errorResponseFromException,
  firstFieldErrors,
  parseJsonBody,
  unauthorizedResponse,
} from "@/src/lib/api/responses";
import { promoCodeFormSchema } from "@/src/contracts/promo-code-schema";

// Reads and writes the campaign catalog per request — never statically cached.
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/promo-codes — one page of the campaign-management list. Admin only.
 *
 * Query params: `page`, `pageSize`, `sort`, `dir` (paging) and `q`, `status`
 * (filters). Responds with `{ items, total, page, pageSize }`.
 *
 * Deliberately separate from the public `GET /api/promo-codes`, which answers the
 * storefront with a bare array of *live* codes only. Two audiences, two answers:
 * an operator's list that hid expired campaigns would hide exactly the rows they
 * came to re-open, and a shopper's list carrying redemption counters would leak a
 * figure that is nobody's business but the store's.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!(await getAdminSession())) return unauthorizedResponse();

  const params = request.nextUrl.searchParams;
  const filters = parseAdminPromoCodeFilters(params);
  const page = parsePageRequest(params, ADMIN_PROMO_CODE_SORTS, {
    sort: DEFAULT_ADMIN_PROMO_CODE_SORT,
    direction: DEFAULT_ADMIN_PROMO_CODE_DIRECTION,
  });

  try {
    const result = await new ListPromoCodes(promoCodeRepository).execute(filters, page);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/promo-codes failed");
  }
}

/**
 * POST /api/admin/promo-codes — author a new campaign. Admin only.
 *
 * Thin controller: authenticate → validate (the same Zod schema the form uses) →
 * delegate to the use-case → map domain errors to HTTP status codes.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getAdminSession();
  if (!session) return unauthorizedResponse();

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
    const created = await new CreatePromoCode(promoCodeRepository, activityLog).execute(parsed.data, {
      id: session.user.id,
      name: session.user.name ?? session.user.id,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return errorResponseFromException(error, "POST /api/admin/promo-codes failed");
  }
}
