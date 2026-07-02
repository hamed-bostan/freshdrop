import { NextResponse } from "next/server";
import { GetCustomerOrderSummaries } from "@/src/domain/use-cases/orders/GetCustomerOrderSummaries";
import { orderRepository, userRepository } from "@/src/infrastructure/container";
import { getAdminSession } from "@/src/lib/require-admin";
import { errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";

// Aggregates the whole order history per request — never statically cached.
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/customers — every customer who has ordered, ranked by total
 * spend (highest first). Admin only; powers the dashboard's "top customers"
 * panel and the customer column on the orders table.
 */
export async function GET(): Promise<NextResponse> {
  if (!(await getAdminSession())) return unauthorizedResponse();

  try {
    const customers = await new GetCustomerOrderSummaries(orderRepository, userRepository).execute();
    return NextResponse.json(customers);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/admin/customers failed");
  }
}
