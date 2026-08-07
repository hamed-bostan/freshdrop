import { NextResponse, type NextRequest } from "next/server";

import { IsSubscribedToStockAlert } from "@/src/domain/use-cases/stock-alerts/IsSubscribedToStockAlert";
import { SubscribeToStockAlert } from "@/src/domain/use-cases/stock-alerts/SubscribeToStockAlert";
import { UnsubscribeFromStockAlert } from "@/src/domain/use-cases/stock-alerts/UnsubscribeFromStockAlert";
import { stockAlertRepository, productRepository } from "@/src/infrastructure/container";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";
import { getUserSession } from "@/src/lib/require-auth";

// Per-user data — never statically cached.
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/products/:id/stock-alert — whether the signed-in user is subscribed to
 * this product's back-in-stock alert. Auth required.
 */
export async function GET(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await getUserSession();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id } = await params;
  try {
    const subscribed = await new IsSubscribedToStockAlert(stockAlertRepository).execute(session.user.id, id);
    return NextResponse.json({ subscribed });
  } catch (error) {
    return errorResponseFromException(error, `GET /api/products/${id}/stock-alert failed`);
  }
}

/**
 * PUT /api/products/:id/stock-alert — subscribe to the back-in-stock alert
 * (idempotent). Auth required.
 */
export async function PUT(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await getUserSession();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id } = await params;
  try {
    await new SubscribeToStockAlert(stockAlertRepository, productRepository).execute(session.user.id, id);
    return NextResponse.json({ subscribed: true });
  } catch (error) {
    return errorResponseFromException(error, `PUT /api/products/${id}/stock-alert failed`);
  }
}

/**
 * DELETE /api/products/:id/stock-alert — unsubscribe. Auth required. 204 on success.
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await getUserSession();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id } = await params;
  try {
    await new UnsubscribeFromStockAlert(stockAlertRepository).execute(session.user.id, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponseFromException(error, `DELETE /api/products/${id}/stock-alert failed`);
  }
}
