"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { MapPin, Clock, FileText, LockKeyhole, Building2, Check, Pencil, Phone, ShoppingBasket, Info, ChevronRight, ChevronLeft, ShieldCheck } from "lucide-react";
import { Link, useRouter } from "@/src/i18n/navigation";
import type { Cart } from "@/src/domain/entities/Cart";
import type { SubstitutionPreference } from "@/src/domain/entities/Order";
import type { DeliveryLocation } from "@/src/domain/entities/DeliveryLocation";
import type { DeliverySlotDay } from "@/src/domain/entities/DeliverySlot";
import type { PaymentMethod } from "@/src/domain/entities/PaymentMethod";
import type { SavedCard } from "@/src/domain/entities/Wallet";
import { Button, FormMessage, Textarea } from "@/src/presentation/design-system";
import { Icon } from "@/src/presentation/design-system";
import { DeliveryLocationPickerSheet } from "@/src/presentation/delivery-location/DeliveryLocationPickerSheet";
import { DeliveryLocationSummary } from "@/src/presentation/delivery-location/components/DeliveryLocationSummary";
import { AddCardRow, PaymentMethodOption, SavedCardOption, paymentMethodLabel } from "@/src/presentation/payment/components";
import { paymentMethodsApi } from "@/src/presentation/payment/payment-method-api";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { useSessionStorageState } from "@/src/lib/hooks/useSessionStorageState";
import {
  CheckoutReviewStep,
  CheckoutSection,
  CheckoutStepper,
  DeliverySlotPicker,
  WalletBalanceToggle,
  type CheckoutStepId,
} from "./components";
import type { SlotSelection } from "./components/DeliverySlotPicker";
import { checkoutApi } from "./checkout-api";
import { useCart } from "@/src/presentation/cart/CartProvider";
import { formatMoney } from "@/src/lib/formatMoney";
import { useLocale } from "next-intl";
import { NOTES_STORAGE_KEY, SLOT_STORAGE_KEY, SUBSTITUTIONS_STORAGE_KEY, reviveSubstitutions } from "./checkoutSession";

/** The checkout form's own character cap on the delivery-instructions note. */
const DELIVERY_INSTRUCTIONS_MAX = 150;

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
  /** The caller's current wallet balance, offered as a pay-with-wallet toggle. */
  walletBalance: number;
  initialStep?: CheckoutStepId;
}

// Keys under which the in-progress selections are stashed in sessionStorage so they
// survive popping out to add/edit an address and coming back (see useSessionStorageState).
// The payment method isn't among them: it's a persisted per-user preference (read from
// the server, written on change), not ephemeral checkout state.

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
  walletBalance,
  initialStep = "delivery",
}: CheckoutScreenProps) {
  const t = useTranslations("checkout");
  const tPayment = useTranslations("payment");
  const tApiErrors = useTranslations("apiErrors");
  const locale = useLocale();
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
  // Not persisted, unlike the payment method itself: applying the wallet is a
  // per-checkout choice, re-decided each time against that checkout's own total.
  const [useWallet, setUseWallet] = React.useState(false);
  const walletApplied = useWallet ? Math.min(walletBalance, cart.total) : 0;
  // The label for "X will be charged to Y" under the wallet toggle — whichever
  // catalog method or saved card is currently selected above it.
  const chargeLabel = React.useMemo(() => {
    const method = paymentMethods.find((m) => m.id === paymentId);
    if (method) return paymentMethodLabel(method, tPayment);
    const card = savedCards.find((c) => c.id === paymentId);
    if (card) return `${card.brand} •••• ${card.number.replace(/\D/g, "").slice(-4)}`;
    return "";
  }, [paymentMethods, savedCards, paymentId, tPayment]);
  const [substitutions, setSubstitutions, clearSubstitutions] = useSessionStorageState<
    Record<string, SubstitutionPreference>
  >(SUBSTITUTIONS_STORAGE_KEY, {}, reviveSubstitutions);
  const [notes, setNotes, clearNotes] = useSessionStorageState<string>(NOTES_STORAGE_KEY, "");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  // The 3-step wizard's current step. Not persisted: a reload lands back on
  // Delivery, same as any of the selections above would still be there to
  // move past again — worth keeping simple rather than a second storage key.
  const [step, setStep] = React.useState<CheckoutStepId>(initialStep);

  const goToPayment = () => {
    if (!selectedAddress) {
      setError(t("errAddress"));
      return;
    }
    if (!slot) {
      setError(t("errTime"));
      return;
    }
    setError(null);
    setStep("payment");
  };

  const goToReview = () => {
    setError(null);
    setStep("review");
  };

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
          deliveryInstructions: notes.trim() || undefined,
          walletApplied: walletApplied > 0 ? walletApplied : undefined,
        });
        // The server cleared the cart and recorded the order — drop the ephemeral
        // selections so the next checkout starts fresh, then navigate. The payment
        // method is a persisted preference and intentionally kept. The confirmation
        // screen re-reads from the server.
        clearSlot();
        clearSubstitutions();
        clearNotes();
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
    <form onSubmit={placeOrder} className="relative left-1/2 flex min-h-dvh w-[min(860px,100vw)] -translate-x-1/2 flex-col gap-4 px-4 pb-6 sm:gap-6 sm:px-8 sm:pb-8">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-border py-4 sm:py-5">
        <button type="button" onClick={() => router.back()} aria-label={t("goBack")}
          className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary">
          <Icon icon={ChevronLeft} size="md" className="rtl:-scale-x-100" />
        </button>
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{t("title")}</h1>
        <span className="flex items-center justify-self-end gap-1.5 text-sm text-muted-foreground sm:gap-2 sm:text-base"><Icon icon={LockKeyhole} size="sm" /><span className="hidden min-[360px]:inline">{t("secure")}</span></span>
      </div>

      <CheckoutStepper current={step} onSelect={setStep} />

      {step === "delivery" && (
        <>
          <CheckoutSection
            icon={MapPin}
            title={t("deliveryAddress")}
            action={
              selectedAddress ? (
                <DeliveryLocationPickerSheet
                  locations={deliveryLocations}
                  trigger={
                    <button type="button" className="text-base font-medium text-primary">
                      + {t("addNewAddress")}
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
              <div className="flex items-center gap-3 rounded-2xl border border-primary bg-primary/[0.025] p-4 sm:gap-5 sm:p-5">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-20"><Icon icon={Building2} size="lg" /></span>
                <div className="min-w-0 flex-1"><DeliveryLocationSummary location={selectedAddress} /></div>
                <div className="flex shrink-0 flex-col items-end justify-between self-stretch text-primary">
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary text-white"><Icon icon={Check} size="sm" /></span>
                  <Link href={`/profile/addresses/${selectedAddress.id}/edit`} aria-label={t("edit")} className="flex items-center gap-2 text-muted-foreground"><Icon icon={Pencil} size="sm" /><span className="hidden sm:inline">{t("edit")}</span></Link>
                </div>
              </div>
            ) : (
              <p className="text-body-b8 text-muted-foreground">{t("noAddress")}</p>
            )}
          </CheckoutSection>

          <CheckoutSection icon={Clock} title={t("deliveryTime")}>
            <DeliverySlotPicker days={deliverySlotDays} selected={slot} onSelect={setSlot} />
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Icon icon={Info} size="sm" />{t("trackingHint")}</p>
          </CheckoutSection>

          <CheckoutSection
            icon={FileText}
            title={t("deliveryInstructions")}
            action={<span className="text-body-b9 text-muted-foreground">{t("deliveryInstructionsOptional")}</span>}
          >
            <div className="flex flex-col gap-1">
              <Textarea
                className="min-h-36 rounded-2xl text-base"
                value={notes}
                onChange={(event) => setNotes(event.target.value.slice(0, DELIVERY_INSTRUCTIONS_MAX))}
                maxLength={DELIVERY_INSTRUCTIONS_MAX}
                placeholder={t("deliveryInstructionsPlaceholder")}
                aria-label={t("deliveryInstructions")}
              />
              <p className="text-end text-body-b9 text-muted-foreground">
                {t("charCount", { count: notes.length, max: DELIVERY_INSTRUCTIONS_MAX })}
              </p>
            </div>
          </CheckoutSection>

          <CheckoutSection icon={Phone} title={t("contact")}>
            <p className="-mt-3 text-sm text-muted-foreground">{t("contactHint")}</p>
            <div className="flex min-h-16 items-center justify-between rounded-2xl border border-border px-4 sm:min-h-20 sm:px-6">
              <span className="flex items-center gap-3 text-base font-semibold sm:gap-4 sm:text-lg"><Icon icon={Phone} size="sm" className="text-primary" />+98 912 *** ****</span>
              <Link href="/profile/details" className="font-medium text-primary">{t("edit")}</Link>
            </div>
          </CheckoutSection>
        </>
      )}

      {step === "payment" && (
        <>
          <div className="flex min-h-24 items-center gap-4 rounded-[18px] bg-primary/[0.06] p-4 sm:min-h-32 sm:rounded-[22px] sm:p-5">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-20"><Icon icon={ShoppingBasket} size="lg" /></span>
            <span className="flex-1 text-lg font-semibold sm:text-xl">{t("orderTotal")}</span>
            <strong className="text-2xl sm:text-3xl">{formatMoney(cart.total, locale)}</strong>
          </div>

          <section className="flex flex-col gap-4 rounded-[18px] border border-border p-4 sm:gap-5 sm:rounded-[22px] sm:p-6">
            <h2 className="text-lg font-semibold sm:text-xl">{t("choosePaymentMethod")}</h2>
            <div className="flex flex-col gap-3">
              {savedCards.map((card) => (
                <SavedCardOption key={card.id} card={card} selected={card.id === paymentId} onSelect={selectPayment} />
              ))}
              <AddCardRow />
              <div className="flex items-center gap-4 py-1 text-sm text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border sm:text-base">{t("otherWaysToPay")}</div>
              {paymentMethods.filter((method) => method.id !== "wallet").map((method) => (
                <PaymentMethodOption
                  key={method.id}
                  method={method}
                  selected={method.id === paymentId}
                  onSelect={selectPayment}
                />
              ))}
            </div>
          </section>

          {walletBalance > 0 && (
            <WalletBalanceToggle
              balance={walletBalance}
              cartTotal={cart.total}
              checked={useWallet}
              onCheckedChange={setUseWallet}
              chargeLabel={chargeLabel}
            />
          )}

          <div className="flex items-center gap-4 rounded-[18px] border border-border p-4 sm:rounded-[22px] sm:p-5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon icon={ShieldCheck} size="md" /></span>
            <div><p className="font-semibold sm:text-lg">{t("securePaymentsTitle")}</p><p className="mt-1 text-sm text-muted-foreground sm:text-base">{t("securePaymentsBody")}</p></div>
          </div>
        </>
      )}

      {step === "review" && (
        <CheckoutReviewStep
          cart={cart}
          items={cart.items}
          selectedAddress={selectedAddress}
          slot={slot}
          deliverySlotDays={deliverySlotDays}
          notes={notes}
          paymentLabel={chargeLabel}
          walletApplied={walletApplied}
          promoCode={promoCode}
          substitutions={substitutions}
          onSubstitutionChange={setSubstitution}
          onEditStep={setStep}
        />
      )}

      {error && (
        <FormMessage size="md" className="text-center">{error}</FormMessage>
      )}

      {step === "delivery" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-2xl bg-primary/[0.06] p-4 sm:gap-5 sm:p-5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-16"><Icon icon={ShoppingBasket} size="md" /></span>
            <div className="min-w-0 flex-1"><p className="text-base font-semibold sm:text-lg">{t("itemTotal", { count: cart.itemCount, amount: cart.total })}</p><p className="mt-1 text-sm text-muted-foreground sm:text-base">{t("includesVat", { amount: cart.taxAmount ?? 0 })}</p></div>
            <Icon icon={Info} size="sm" className="text-muted-foreground" />
          </div>
          <Button type="button" size="lg" onClick={goToPayment} className="min-h-16 w-full text-lg sm:min-h-20 sm:text-xl">
            {t("continueToPayment")}<Icon icon={ChevronRight} size="md" className="ms-auto rtl:-scale-x-100" />
          </Button>
        </div>
      )}
      {step === "payment" && (
        <div className="mt-auto flex flex-col gap-4 border-t border-border bg-background pt-5">
          <div className="flex items-center justify-between text-xl font-semibold sm:text-2xl"><span>{t("total")}</span><span>{formatMoney(cart.total, locale)}</span></div>
          <Button type="button" size="lg" onClick={goToReview} className="min-h-16 w-full text-lg sm:min-h-20 sm:text-xl">{t("continueToReview")}<Icon icon={ChevronRight} size="md" className="ms-auto rtl:-scale-x-100" /></Button>
        </div>
      )}
      {step === "review" && (
        <div className="mt-auto flex flex-col gap-4 border-t border-border bg-background pt-5">
          <div className="flex items-center justify-between text-xl font-semibold sm:text-2xl"><span>{t("total")}</span><span>{formatMoney(cart.total, locale)}</span></div>
          <Button type="submit" size="lg" disabled={pending} className="min-h-16 w-full text-lg sm:min-h-20 sm:text-xl">
            <Icon icon={LockKeyhole} size="md" />{pending ? t("placingOrder") : t("placeOrderWithTotal", { amount: formatMoney(cart.total, locale) })}
          </Button>
        </div>
      )}
    </form>
  );
}
