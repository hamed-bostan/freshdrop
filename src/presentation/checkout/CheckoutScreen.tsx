"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { MapPin, Clock, CreditCard, ClipboardList, Replace } from "lucide-react";
import { Link, useRouter } from "@/src/i18n/navigation";
import type { Cart } from "@/src/domain/entities/Cart";
import type { SubstitutionPreference } from "@/src/domain/entities/Order";
import type { DeliveryLocation } from "@/src/domain/entities/DeliveryLocation";
import type { DeliverySlotDay } from "@/src/domain/entities/DeliverySlot";
import type { PaymentMethod } from "@/src/domain/entities/PaymentMethod";
import type { SavedCard } from "@/src/domain/entities/Wallet";
import { Button } from "@/src/presentation/design-system";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { DeliveryLocationPickerSheet } from "@/src/presentation/delivery-location/DeliveryLocationPickerSheet";
import { DeliveryLocationSummary } from "@/src/presentation/delivery-location/components/DeliveryLocationSummary";
import { PaymentMethodOption, SavedCardOption } from "@/src/presentation/payment/components";
import { paymentMethodsApi } from "@/src/presentation/payment/payment-method-api";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
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
  /** The user's saved cards, selectable alongside the catalog options. */
  savedCards: SavedCard[];
  /**
   * The user's persisted checkout payment selection (a catalog option or saved card
   * id), or `null` when unset — the same preference set on the Payment Method screen.
   */
  selectedPaymentMethodId: string | null;
  /** Promo code applied in the cart, forwarded so the server's totals match. */
  promoCode?: string;
}

// Keys under which the in-progress selections are stashed in sessionStorage so they
// survive popping out to add/edit an address and coming back (see useSessionStorageState).
// The payment method isn't among them: it's a persisted per-user preference (read from
// the server, written on change), not ephemeral checkout state.
const SLOT_STORAGE_KEY = "freshdrop:checkout:slot";
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
  savedCards,
  selectedPaymentMethodId,
  promoCode,
}: CheckoutScreenProps) {
  const t = useTranslations("checkout");
  const tApiErrors = useTranslations("apiErrors");
  const router = useRouter();
  const { refresh: refreshCart } = useCart();
  // The delivery address isn't chosen here — the user selects it in the home sheet or
  // on Manage Address, which persists it as their default. Checkout just reflects that
  // one selected address (falling back to the oldest if somehow none is flagged).
  const selectedAddress = deliveryLocations.find((location) => location.isDefault) ?? deliveryLocations[0];
  // The slot and substitution selections persist to sessionStorage so leaving checkout
  // to manage an address (or a reload) doesn't wipe them; they clear once the order is
  // placed. The payment method is handled separately — a server-persisted preference.
  const defaultSlot = React.useMemo(() => firstBookableSlot(deliverySlotDays), [deliverySlotDays]);
  const [slot, setSlot, clearSlot] = useSessionStorageState<SlotSelection | null>(
    SLOT_STORAGE_KEY,
    defaultSlot,
    // A remembered slot may have sold out or rolled off the schedule while the user
    // was away — only restore it if it's still an open window, else fall back.
    (stored) => (stored && isBookable(deliverySlotDays, stored) ? stored : defaultSlot),
  );
  // Payment is a persisted per-user preference (the same one the Payment Method
  // screen sets), not ephemeral checkout state. Seed the highlight from the stored
  // selection — falling back to the first catalog option when it's unset or stale
  // (e.g. a card since removed) — and write each change straight back to the server.
  const initialPaymentId = React.useMemo(() => {
    const available = new Set([...paymentMethods.map((m) => m.id), ...savedCards.map((c) => c.id)]);
    return selectedPaymentMethodId && available.has(selectedPaymentMethodId)
      ? selectedPaymentMethodId
      : paymentMethods[0]?.id;
  }, [paymentMethods, savedCards, selectedPaymentMethodId]);
  const [paymentId, setPaymentId] = React.useState(initialPaymentId);
  const [, startPaymentTransition] = React.useTransition();
  const [substitutions, setSubstitutions, clearSubstitutions] = useSessionStorageState<
    Record<string, SubstitutionPreference>
  >(SUBSTITUTIONS_STORAGE_KEY, {}, reviveSubstitutions);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const selectPayment = (id: string) => {
    const previous = paymentId;
    setPaymentId(id); // optimistic highlight
    startPaymentTransition(async () => {
      try {
        await paymentMethodsApi.select(id);
      } catch {
        // Didn't persist — snap the highlight back to the previous choice.
        setPaymentId(previous);
      }
    });
  };

  const setSubstitution = (productId: string, preference: SubstitutionPreference) =>
    setSubstitutions((prev) => ({ ...prev, [productId]: preference }));

  const placeOrder = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedAddress) {
      setError(t("errAddress"));
      return;
    }
    if (!slot) {
      setError(t("errTime"));
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
        // The server cleared the cart and recorded the order — drop the ephemeral
        // selections so the next checkout starts fresh, then navigate. The payment
        // method is a persisted preference and intentionally kept. The confirmation
        // screen re-reads from the server.
        clearSlot();
        clearSubstitutions();
        // The order cleared the cart server-side: resync the shared cart store so
        // the nav badge empties, then navigate and refresh the confirmation RSC.
        refreshCart();
        router.push("/cart/checkout/confirmed");
        router.refresh();
      } catch (err) {
        setError(localizeApiError(err, tApiErrors, t("errGeneric")));
      }
    });
  };

  return (
    <form onSubmit={placeOrder} className="flex min-h-dvh flex-col gap-6 px-6 pb-28">
      <PageHeader title={t("title")} />

      <CheckoutSection
        icon={MapPin}
        title={t("deliverTo")}
        action={
          selectedAddress ? (
            <DeliveryLocationPickerSheet
              locations={deliveryLocations}
              trigger={
                <button type="button" className="text-body-b8 text-primary">
                  {t("change")}
                </button>
              }
            />
          ) : (
            <Link href="/profile/addresses/new" className="text-body-b8 text-primary">
              {t("addNewAddress")}
            </Link>
          )
        }
      >
        {selectedAddress ? (
          <div className="flex items-center rounded-card-xl border border-foreground bg-surface px-4 py-2">
            <DeliveryLocationSummary location={selectedAddress} />
          </div>
        ) : (
          <p className="text-body-b8 text-muted-foreground">{t("noAddress")}</p>
        )}
      </CheckoutSection>

      <CheckoutSection icon={Clock} title={t("deliveryTime")}>
        <DeliverySlotPicker days={deliverySlotDays} selected={slot} onSelect={setSlot} />
      </CheckoutSection>

      <CheckoutSection icon={CreditCard} title={t("paymentMethod")}>
        <div className="flex flex-col gap-2">
          {paymentMethods.map((method) => (
            <PaymentMethodOption
              key={method.id}
              method={method}
              selected={method.id === paymentId}
              onSelect={selectPayment}
            />
          ))}
          {savedCards.map((card) => (
            <SavedCardOption
              key={card.id}
              card={card}
              selected={card.id === paymentId}
              onSelect={selectPayment}
            />
          ))}
        </div>
      </CheckoutSection>

      <CheckoutSection icon={ClipboardList} title={t("orderSummary")}>
        <OrderSummaryCard items={cart.items} />
      </CheckoutSection>

      <CheckoutSection icon={Replace} title={t("ifOutOfStock")}>
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
        {pending ? t("placingOrder") : t("placeOrder")}
      </Button>
    </form>
  );
}
