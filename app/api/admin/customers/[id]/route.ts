import { NextResponse } from "next/server";
import { GetCustomerDetail } from "@/src/domain/use-cases/customers/GetCustomerDetail";
import {
  deliveryLocationRepository,
  orderRepository,
  orderNoteRepository,
  reviewRepository,
  userRepository,
  walletRepository,
} from "@/src/infrastructure/container";
import { getSessionWith } from "@/src/lib/require-permission";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";

// Reads one customer's profile, orders, addresses, wallet and reviews per request —
// never statically cached.
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/customers/:id — everything the dashboard shows about one customer:
 * profile, lifetime figures, order history, saved addresses, wallet and the reviews
 * they wrote. Admin only.
 *
 * This is the deepest cross-user read in the app — it deliberately reaches into data
 * the storefront only ever serves to its owner (addresses, wallet balance and card
 * list). The admin gate is the whole of what keeps that correct, so it comes first
 * and there is no public sibling to this endpoint.
 *
 * 404 when the id names nobody, raised as a `NotFoundError` by the use-case and
 * mapped here, so the detail page can `notFound()`.
 */
export async function GET(_request: Request, { params }: RouteContext): Promise<NextResponse> {
  if (!(await getSessionWith("dashboard.view"))) return unauthorizedResponse();

  const { id } = await params;
  try {
    const detail = await new GetCustomerDetail(
      userRepository,
      orderRepository,
      deliveryLocationRepository,
      walletRepository,
      reviewRepository,
      orderNoteRepository,
    ).execute(id);
    return NextResponse.json(detail);
  } catch (error) {
    return errorResponseFromException(error, `GET /api/admin/customers/${id} failed`);
  }
}
