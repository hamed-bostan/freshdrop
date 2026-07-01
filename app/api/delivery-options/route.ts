import { NextResponse } from "next/server";
import { GetDeliveryOptions } from "@/src/domain/use-cases/delivery-options/GetDeliveryOptions";
import { deliveryOptionRepository } from "@/src/infrastructure/container";
import { errorResponseFromException } from "@/src/lib/api/responses";

// Read from Postgres per request — never statically cached.
export const dynamic = "force-dynamic";

/**
 * GET /api/delivery-options — the delivery-time catalog (Fast, Standard, …).
 * Public reference data, like payment methods: the checkout screen reads it.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const options = await new GetDeliveryOptions(deliveryOptionRepository).execute();
    return NextResponse.json(options);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/delivery-options failed");
  }
}
