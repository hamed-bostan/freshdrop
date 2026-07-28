"use client";

import { useLocale, useTranslations } from "next-intl";
import { MapPin, Clock, Wallet, FileText, ShieldCheck } from "lucide-react";
import type { Cart, CartItem } from "@/src/domain/entities/Cart";
import type { SubstitutionPreference } from "@/src/domain/entities/Order";
import type { DeliveryLocation } from "@/src/domain/entities/DeliveryLocation";
import type { DeliverySlotDay } from "@/src/domain/entities/DeliverySlot";
import { formatMoney } from "@/src/lib/formatMoney";
import { Icon } from "@/src/presentation/design-system";
import { OrderTotals } from "./OrderTotals";
import { SubstitutionPreferenceList } from "./SubstitutionPreferenceList";
import type { CheckoutStepId } from "./CheckoutStepper";
import type { SlotSelection } from "./DeliverySlotPicker";
import { slotDayLabel, slotName, slotTimeRange } from "../deliverySlotFormat";

interface Props {
  cart: Cart; items: CartItem[]; selectedAddress: DeliveryLocation | undefined; slot: SlotSelection | null;
  deliverySlotDays: DeliverySlotDay[]; notes: string; paymentLabel: string; walletApplied: number;
  promoCode?: string;
  substitutions: Record<string, SubstitutionPreference>;
  onSubstitutionChange: (productId: string, preference: SubstitutionPreference) => void;
  onEditStep: (step: CheckoutStepId) => void;
}

export function CheckoutReviewStep({ cart, items, selectedAddress, slot, deliverySlotDays, notes, paymentLabel, walletApplied, promoCode, substitutions, onSubstitutionChange, onEditStep }: Props) {
  const t = useTranslations("checkout");
  const tSlots = useTranslations("checkout.slots");
  const locale = useLocale();
  const slotDay = slot ? deliverySlotDays.find((day) => day.date === slot.date) : undefined;
  const slotWindow = slotDay?.slots.find((window) => window.windowId === slot?.windowId);
  const slotDisplay = slotDay && slotWindow ? `${slotDayLabel(slotDay, locale, t)} · ${slotName(slotWindow.windowId, slotWindow.label, tSlots)} · ${slotTimeRange(slotWindow.windowId, slotWindow.timeRange, locale)}` : null;

  const Summary = ({ icon, title, editStep, children }: { icon: typeof MapPin; title: string; editStep: CheckoutStepId; children: React.ReactNode }) => (
    <section className="flex gap-3 rounded-[18px] border border-border p-4 sm:gap-5 sm:rounded-[22px] sm:p-5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-16"><Icon icon={icon} size="md" /></span>
      <div className="min-w-0 flex-1"><h2 className="text-lg font-semibold">{title}</h2><div className="mt-1 text-sm text-muted-foreground sm:text-base">{children}</div></div>
      <button type="button" onClick={() => onEditStep(editStep)} className="self-start font-medium text-primary">{t("edit")}</button>
    </section>
  );

  return <>
    <div className="pb-1 pt-2"><h2 className="text-2xl font-semibold sm:text-3xl">{t("reviewYourOrder")}</h2><p className="mt-2 text-sm text-muted-foreground sm:text-base">{t("reviewYourOrderHint")}</p></div>
    <Summary icon={MapPin} title={t("stepDelivery")} editStep="delivery">
      <p className="font-medium text-foreground">{selectedAddress?.label ?? t("noAddress")}</p>
      {selectedAddress && <p className="mt-1 line-clamp-2">{selectedAddress.address}</p>}
      {slotDisplay && <p className="mt-1 flex items-center gap-1.5"><Icon icon={Clock} size="sm" />{slotDisplay}</p>}
    </Summary>
    <Summary icon={Wallet} title={t("stepPayment")} editStep="payment"><p>{walletApplied > 0 ? `${t("walletName")} ${formatMoney(walletApplied, locale)} + ` : ""}{paymentLabel}</p></Summary>
    <SubstitutionPreferenceList items={items} value={substitutions} onChange={onSubstitutionChange} promoCode={promoCode} />
    <Summary icon={FileText} title={t("deliveryInstructions")} editStep="delivery"><p>{notes.trim() || t("deliveryInstructionsNone")}</p></Summary>
    <OrderTotals subtotal={cart.subtotal} shipping={cart.shipping} discount={cart.discount} taxAmount={cart.taxAmount} walletApplied={walletApplied} paymentLabel={paymentLabel} />
    <div className="flex items-center justify-center gap-3 rounded-[18px] bg-primary/[0.07] p-4 text-primary sm:rounded-[22px]"><Icon icon={ShieldCheck} size="md" /><div><p className="font-semibold text-foreground sm:text-lg">{t("satisfactionTitle")}</p><p className="text-sm sm:text-base">{t("satisfactionBody")}</p></div></div>
    <p className="px-2 text-center text-sm text-muted-foreground">{t("termsText")}</p>
  </>;
}
