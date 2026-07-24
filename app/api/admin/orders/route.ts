import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_ORDER_SORTS,
  DEFAULT_ADMIN_ORDER_DIRECTION,
  DEFAULT_ADMIN_ORDER_SORT,
} from "@/src/domain/entities/AdminOrderFilters";
import { ListOrders } from "@/src/domain/use-cases/orders/ListOrders";
import { PlaceOrderForCustomer } from "@/src/domain/use-cases/orders/PlaceOrderForCustomer";
import {
  deliverySlotRepository,
  orderNotifier,
  orderRepository,
  productRepository,
  unitOfWork,
  userRepository,
} from "@/src/infrastructure/container";
import { adminOrderSchema } from "@/src/contracts/admin-order-schema";
import { getSessionWith } from "@/src/lib/require-permission";
import { parseAdminOrderFilters } from "@/src/lib/api/admin-order-params";
import { parsePageRequest } from "@/src/lib/api/pagination-params";
import {
  errorResponse,
  errorResponseFromException,
  firstFieldErrors,
  parseJsonBody,
  unauthorizedResponse,
} from "@/src/lib/api/responses";

// Reads a page of orders per request — never statically cached.
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/orders — one page of the cross-user order list. Admin only;
 * powers the dashboard's order-tracking table.
 *
 * Query params: `page`, `pageSize`, `sort`, `dir` (paging) and `q`, `status`
 * (filters). Responds with `{ items, total, page, pageSize }`.
 *
 * The storefront's per-user list is the separate `GET /api/orders`. There is no
 * whole-history variant: the overview's KPIs, which were the only caller of one,
 * now read aggregates from `GET /api/admin/analytics`.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!(await getSessionWith("dashboard.view"))) return unauthorizedResponse();

  const params = request.nextUrl.searchParams;
  const filters = parseAdminOrderFilters(params);
  const page = parsePageRequest(params, ADMIN_ORDER_SORTS, {
    sort: DEFAULT_ADMIN_ORDER_SORT,
    direction: DEFAULT_ADMIN_ORDER_DIRECTION,
  });

  try {
    const result = await new ListOrders(orderRepository, userRepository).execute(filters, page);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/orders failed");
  }
}

/**
 * POST /api/admin/orders — place an order on a customer's behalf, for the order
 * that arrives by phone. Responds with the placed order.
 *
 * Gated on `orders.fulfill`, the permission that already covers moving an order
 * along and calling one off. Creating one consumes the same two scarce resources
 * those do (stock, a delivery slot) and is the same job.
 *
 * The body carries no amounts — see `adminOrderSchema`. Whoever is entering it
 * comes from the session, never the body, so the activity entry the use-case
 * writes names the person who actually did it.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWith("orders.fulfill");
  if (!session) return unauthorizedResponse();

  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = adminOrderSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, {
      message: "Please fix the highlighted fields.",
      code: "VALIDATION",
      fieldErrors: firstFieldErrors(parsed.error),
    });
  }

  try {
    const order = await new PlaceOrderForCustomer(
      unitOfWork,
      productRepository,
      userRepository,
      deliverySlotRepository,
      orderNotifier,
    ).execute(parsed.data, { id: session.user.id, name: session.user.name ?? session.user.id });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return errorResponseFromException(error, "POST /api/admin/orders failed");
  }
}
