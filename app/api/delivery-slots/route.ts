import { NextResponse } from "next/server";

import { GetDeliverySlots } from "@/src/domain/use-cases/delivery-slots/GetDeliverySlots";
import { deliverySlotRepository } from "@/src/infrastructure/container";
import { errorResponseFromException } from "@/src/lib/api/responses";

// Availability depends on live bookings and the current time — never statically cached.
export const dynamic = "force-dynamic";

/**
 * GET /api/delivery-slots — the bookable delivery windows for the next few days,
 * grouped by day with live availability. Public reference data, like the payment
 * methods: the checkout screen reads it to render the slot picker.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const days = await new GetDeliverySlots(deliverySlotRepository).execute();
    return NextResponse.json(days);
  } catch (error) {
    return errorResponseFromException(error, "GET /api/delivery-slots failed");
  }
}
