"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Clock, CreditCard, ClipboardList, Replace } from "lucide-react";
import type { Cart } from "@/src/domain/entities/Cart";
import type { SubstitutionPreference } from "@/src/domain/entities/Order";
import type { DeliveryLocation } from "@/src/domain/entities/DeliveryLocation";
import type { DeliverySlotDay } from "@/src/domain/entities/DeliverySlot";
import type { PaymentMethod } from "@/src/domain/entities/PaymentMethod";
import { Button } from "@/src/presentation/design-system";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { DeliveryLocationPickerSheet } from "@/src/presentation/delivery-location/DeliveryLocationPickerSheet";
import { DeliveryLocationSummary } from "@/src/presentation/delivery-location/components/DeliveryLocationSummary";
import { PaymentMethodOption } from "@/src/presentation/payment/components";
import { ApiError } from "@/src/lib/api/ApiError";
import { useSessionStorageState } from "@/src/lib/hooks/useSessionStorageState";
import {
  CheckoutSection,
  DeliverySlotPicker,
  OrderSummaryCard,
  OrderTotals,
  SubstitutionPreferenceList,
} from "./components";
import type { SlotSelection } from "./components/DeliverySlotPicker";
import { checkoutApi } from "./checkout-api";
import { useCart } from "@/src/presentation/cart/CartProvider";

interface CheckoutScreenProps {
  cart: Cart;
  deliveryLocations: DeliveryLocation[];
  deliverySlotDays: DeliverySlotDay[];
  paymentMethods: PaymentMethod[];
  /** Promo code applied in the cart, forwarded so the server's totals match. */
  promoCode?: string;
}

// Keys under which the in-progress selections are stashed in sessionStorage so they
// survive popping out to add/edit an address and coming back (see useSessionStorageState).
const SLOT_STORAGE_KEY = "freshdrop:checkout:slot";
const PAYMENT_STORAGE_KEY = "freshdrop:checkout:payment";
const SUBSTITUTIONS_STORAGE_KEY = "freshdrop:checkout:substitutions";

/** The first window that can still be booked, used as the default selection. */
function firstBookableSlot(days: DeliverySlotDay[]): SlotSelection | null {
  for (const day of days) {
    const slot = day.slots.find((s) => s.availability.level !== "full");
    if (slot) return { date: day.date, windowId: slot.windowId };
  }
  return null;
}

/** Whether a (restored) selection still points at a window that's open for booking. */
function isBookable(days: DeliverySlotDay[], selection: SlotSelection): boolean {
  const slot = days
    .find((day) => day.date === selection.date)
    ?.slots.find((s) => s.windowId === selection.windowId);
  return slot !== undefined && slot.availability.level !== "full";
}

/**
 * Sanitize substitution preferences restored from sessionStorage — untrusted, since
 * it's client-writable. Drop anything that isn't a recognized preference so a
 * tampered/stale entry can't reach the order payload (the server re-validates too).
 */
function reviveSubstitutions(
  stored: Record<string, SubstitutionPreference>,
): Record<string, SubstitutionPreference> {
  if (typeof stored !== "object" || stored === null) return {};
  const clean: Record<string, SubstitutionPreference> = {};
  for (const [productId, preference] of Object.entries(stored)) {
    if (preference === "substitute" || preference === "refund") clean[productId] = preference;
  }
  return clean;
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
  const { refresh: refreshCart } = useCart();
  // The delivery address isn't chosen here — the user selects it in the home sheet or
  // on Manage Address, which persists it as their default. Checkout just reflects that
  // one selected address (falling back to the oldest if somehow none is flagged).
  const selectedAddress = deliveryLocations.find((location) => location.isDefault) ?? deliveryLocations[0];
  // The three selections persist to sessionStorage so leaving checkout to manage an
  // address (or a reload) doesn't wipe them; they clear once the order is placed.
  const defaultSlot = React.useMemo(() => firstBookableSlot(deliverySlotDays), [deliverySlotDays]);
  const [slot, setSlot, clearSlot] = useSessionStorageState<SlotSelection | null>(
    SLOT_STORAGE_KEY,
    defaultSlot,
    // A remembered slot may have sold out or rolled off the schedule while the user
    // was away — only restore it if it's still an open window, else fall back.
    (stored) => (stored && isBookable(deliverySlotDays, stored) ? stored : defaultSlot),
  );
  const [paymentId, setPaymentId, clearPayment] = useSessionStorageState<string | undefined>(
    PAYMENT_STORAGE_KEY,
    paymentMethods[0]?.id,
  );
  const [substitutions, setSubstitutions, clearSubstitutions] = useSessionStorageState<
    Record<string, SubstitutionPreference>
  >(SUBSTITUTIONS_STORAGE_KEY, {}, reviveSubstitutions);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const setSubstitution = (productId: string, preference: SubstitutionPreference) =>
    setSubstitutions((prev) => ({ ...prev, [productId]: preference }));

  const placeOrder = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedAddress) {
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
          addressId: selectedAddress.id,
          deliveryDate: slot.date,
          deliveryWindowId: slot.windowId,
          promo: promoCode,
          substitutions: cart.items.map((item) => ({
            productId: item.product.id,
            preference: substitutions[item.product.id] ?? "substitute",
          })),
        });
        // The server cleared the cart and recorded the order — drop the saved
        // selections so the next checkout starts fresh, then navigate. The
        // confirmation screen re-reads from the server.
        clearSlot();
        clearPayment();
        clearSubstitutions();
        // The order cleared the cart server-side: resync the shared cart store so
        // the nav badge empties, then navigate and refresh the confirmation RSC.
        refreshCart();
        router.push("/cart/checkout/confirmed");
        router.refresh();
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
          selectedAddress ? (
            <DeliveryLocationPickerSheet
              locations={deliveryLocations}
              trigger={
                <button type="button" className="text-body-b8 text-primary">
                  Change
                </button>
              }
            />
          ) : (
            <Link href="/profile/addresses/new" className="text-body-b8 text-primary">
              Add New Address
            </Link>
          )
        }
      >
        {selectedAddress ? (
          <div className="flex items-center rounded-card-xl border border-foreground bg-surface px-4 py-2">
            <DeliveryLocationSummary location={selectedAddress} />
          </div>
        ) : (
          <p className="text-body-b8 text-muted-foreground">
            You don&apos;t have a saved address yet. Add one to continue.
          </p>
        )}
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

      <CheckoutSection
        icon={Replace}
        title="If an item is out of stock"
      >
        <SubstitutionPreferenceList
          items={cart.items}
          value={substitutions}
          onChange={setSubstitution}
        />
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
