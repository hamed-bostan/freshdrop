"use client";

import { useLocale, useTranslations } from "next-intl";
import { MapPin, Clock, CreditCard, ClipboardList, FileText } from "lucide-react";
import type { Cart, CartItem } from "@/src/domain/entities/Cart";
import type { SubstitutionPreference } from "@/src/domain/entities/Order";
import type { DeliveryLocation } from "@/src/domain/entities/DeliveryLocation";
import type { DeliverySlotDay } from "@/src/domain/entities/DeliverySlot";
import { formatMoney } from "@/src/lib/formatMoney";
import { DeliveryLocationSummary } from "@/src/presentation/delivery-location/components/DeliveryLocationSummary";
import { CheckoutSection } from "./CheckoutSection";
import { OrderTotals } from "./OrderTotals";
import { SubstitutionPreferenceList } from "./SubstitutionPreferenceList";
import type { CheckoutStepId } from "./CheckoutStepper";
import type { SlotSelection } from "./DeliverySlotPicker";
import { slotDayLabel, slotName, slotTimeRange } from "../deliverySlotFormat";

interface CheckoutReviewStepProps {
  cart: Cart;
  items: CartItem[];
  selectedAddress: DeliveryLocation | undefined;
  slot: SlotSelection | null;
  deliverySlotDays: DeliverySlotDay[];
  notes: string;
  paymentLabel: string;
  walletApplied: number;
  substitutions: Record<string, SubstitutionPreference>;
  onSubstitutionChange: (productId: string, preference: SubstitutionPreference) => void;
  /** Jumps back to an earlier wizard step from a summary card's "Edit" link. */
  onEditStep: (step: CheckoutStepId) => void;
}

/**
 * The Review step: a read-only recap of every prior choice — delivery,
 * payment, items and delivery instructions — each in its own card with an
 * "Edit" link back to the step it was made on, followed by the full price
 * breakdown and the terms notice. This is where "Place Order" actually lives;
 * the earlier steps only collect the selections it submits.
 */
export function CheckoutReviewStep({
  cart,
  items,
  selectedAddress,
  slot,
  deliverySlotDays,
  notes,
  paymentLabel,
  walletApplied,
  substitutions,
  onSubstitutionChange,
  onEditStep,
}: CheckoutReviewStepProps) {
  const t = useTranslations("checkout");
  const tSlots = useTranslations("checkout.slots");
  const locale = useLocale();

  const slotDay = slot ? deliverySlotDays.find((d) => d.date === slot.date) : undefined;
  const slotWindow = slotDay?.slots.find((s) => s.windowId === slot?.windowId);
  const slotDisplay =
    slotDay && slotWindow
      ? `${slotDayLabel(slotDay, locale, t)} · ${slotName(slotWindow.windowId, slotWindow.label, tSlots)} · ${slotTimeRange(slotWindow.windowId, slotWindow.timeRange, locale)}`
      : null;

  const editLink = (step: CheckoutStepId) => (
    <button type="button" onClick={() => onEditStep(step)} className="text-body-b8 text-primary">
      {t("edit")}
    </button>
  );

  return (
    <>
      <CheckoutSection icon={MapPin} title={t("deliverTo")} action={editLink("delivery")}>
        <div className="flex flex-col gap-3 rounded-card-xl border border-foreground bg-surface px-4 py-2">
          {selectedAddress ? (
            <DeliveryLocationSummary location={selectedAddress} />
          ) : (
            <p className="text-body-b8 text-muted-foreground">{t("noAddress")}</p>
          )}
          {slotDisplay && (
            <div className="flex items-center gap-2 border-t border-border pt-2">
              <Clock className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="text-body-b8 text-foreground">{slotDisplay}</span>
            </div>
          )}
        </div>
      </CheckoutSection>

      <CheckoutSection icon={CreditCard} title={t("paymentMethod")} action={editLink("payment")}>
        <div className="flex flex-col gap-1 rounded-card-xl border border-foreground bg-surface px-4 py-2">
          <span className="text-body-b8 text-foreground">{paymentLabel}</span>
          {walletApplied > 0 && (
            <span className="text-body-b9 text-muted-foreground">
              {t("walletAppliedLabel", { amount: formatMoney(walletApplied, locale) })}
            </span>
          )}
        </div>
      </CheckoutSection>

      <CheckoutSection icon={ClipboardList} title={t("orderSummary")}>
        <SubstitutionPreferenceList items={items} value={substitutions} onChange={onSubstitutionChange} />
      </CheckoutSection>

      <CheckoutSection icon={FileText} title={t("deliveryInstructions")} action={editLink("delivery")}>
        <p className="rounded-card-xl border border-foreground bg-surface px-4 py-2 text-body-b8 text-foreground">
          {notes.trim() || t("deliveryInstructionsNone")}
        </p>
      </CheckoutSection>

      <OrderTotals
        subtotal={cart.subtotal}
        shipping={cart.shipping}
        discount={cart.discount}
        taxAmount={cart.taxAmount}
        walletApplied={walletApplied}
      />

      <p className="px-4 text-center text-body-b10 text-muted-foreground">{t("termsText")}</p>
    </>
  );
}
