"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Clock, CreditCard, ClipboardList } from "lucide-react";
import type { Cart } from "@/src/domain/entities/Cart";
import type { DeliveryLocation } from "@/src/domain/entities/DeliveryLocation";
import type { DeliverySlotDay } from "@/src/domain/entities/DeliverySlot";
import type { PaymentMethod } from "@/src/domain/entities/PaymentMethod";
import { Button } from "@/src/presentation/design-system";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { DeliveryLocationItem } from "@/src/presentation/delivery-location/components/DeliveryLocationItem";
import { PaymentMethodOption } from "@/src/presentation/payment/components";
import { ApiError } from "@/src/lib/api/ApiError";
import { CheckoutSection, DeliverySlotPicker, OrderSummaryCard, OrderTotals } from "./components";
import type { SlotSelection } from "./components/DeliverySlotPicker";
import { checkoutApi } from "./checkout-api";

interface CheckoutScreenProps {
  cart: Cart;
  deliveryLocations: DeliveryLocation[];
  deliverySlotDays: DeliverySlotDay[];
  paymentMethods: PaymentMethod[];
  /** Promo code applied in the cart, forwarded so the server's totals match. */
  promoCode?: string;
}

/** The first window that can still be booked, used as the default selection. */
function firstBookableSlot(days: DeliverySlotDay[]): SlotSelection | null {
  for (const day of days) {
    const slot = day.slots.find((s) => s.availability.level !== "full");
    if (slot) return { date: day.date, windowId: slot.windowId };
  }
  return null;
}

/**
 * The checkout / "Place Order" step reached from the cart. Composes the existing
 * delivery-location and payment-method selectors with a delivery-time choice, an
 * order recap and the price breakdown. Owns only the three selections; the cart
 * totals come pre-computed from the server.
 */
export default function CheckoutScreen({
  cart,
  deliveryLocations,
  deliverySlotDays,
  paymentMethods,
  promoCode,
}: CheckoutScreenProps) {
  const router = useRouter();
  const [addressId, setAddressId] = React.useState(() => deliveryLocations[0]?.id);
  const [slot, setSlot] = React.useState<SlotSelection | null>(() => firstBookableSlot(deliverySlotDays));
  const [paymentId, setPaymentId] = React.useState(() => paymentMethods[0]?.id);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const placeOrder = (event: React.FormEvent) => {
    event.preventDefault();
    if (!addressId) {
      setError("Select a delivery address.");
      return;
    }
    if (!slot) {
      setError("Select a delivery time.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await checkoutApi.placeOrder({
          addressId,
          deliveryDate: slot.date,
          deliveryWindowId: slot.windowId,
          promo: promoCode,
        });
        // The server cleared the cart and recorded the order; the confirmation
        // screen re-reads from the server, so just navigate.
        router.push("/cart/checkout/confirmed");
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Couldn't place your order. Please try again.",
        );
      }
    });
  };

  return (
    <form onSubmit={placeOrder} className="flex min-h-dvh flex-col gap-6 px-6 pb-28">
      <PageHeader title="Checkout" />

      <CheckoutSection
        icon={MapPin}
        title="Deliver To"
        action={
          <Link href="/profile/addresses/new" className="text-body-b8 text-primary">
            Add New Address
          </Link>
        }
      >
        <div className="flex flex-col gap-2">
          {deliveryLocations.map((location) => (
            <DeliveryLocationItem
              key={location.id}
              location={location}
              selected={location.id === addressId}
              onSelect={() => setAddressId(location.id)}
              onEdit={() => router.push("/profile/addresses")}
            />
          ))}
        </div>
      </CheckoutSection>

      <CheckoutSection icon={Clock} title="Delivery Time">
        <DeliverySlotPicker days={deliverySlotDays} selected={slot} onSelect={setSlot} />
      </CheckoutSection>

      <CheckoutSection icon={CreditCard} title="Payment Method">
        <div className="flex flex-col gap-2">
          {paymentMethods.map((method) => (
            <PaymentMethodOption
              key={method.id}
              method={method}
              selected={method.id === paymentId}
              onSelect={setPaymentId}
            />
          ))}
        </div>
      </CheckoutSection>

      <CheckoutSection icon={ClipboardList} title="Order Summary">
        <OrderSummaryCard items={cart.items} />
      </CheckoutSection>

      <OrderTotals
        subtotal={cart.subtotal}
        shipping={cart.shipping}
        discount={cart.discount}
        total={cart.total}
      />

      {error && (
        <p role="alert" className="text-center text-body-b8 text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending} className="mt-auto w-full">
        {pending ? "Placing Order…" : "Place Order"}
      </Button>
    </form>
  );
}
