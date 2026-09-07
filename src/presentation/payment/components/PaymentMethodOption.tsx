"use client";

import { useTranslations } from "next-intl";

import type { PaymentMethod } from "@/src/domain/entities/PaymentMethod";
import { cn } from "@/src/lib/utils";
import { SelectableTile } from "@/src/presentation/design-system";

import styles from "../PaymentMethodScreen.module.css";

import { PaymentMethodIcon } from "./PaymentMethodIcon";


interface PaymentMethodOptionProps {
  method: PaymentMethod;
  selected: boolean;
  onSelect: (id: string) => void;
}

// Method id → its label key. The presentation owns this mapping (as it does the
// icon), so the fixed catalog of methods renders in the active locale. An unknown
// id (e.g. a method added later without a key yet) falls back to the stored label.
const LABEL_KEYS: Record<
  string,
  "methodCashOnDelivery" | "methodWallet" | "methodPaypal" | "methodApplePay" | "methodGooglePay"
> = {
  "cash-on-delivery": "methodCashOnDelivery",
  wallet: "methodWallet",
  paypal: "methodPaypal",
  "apple-pay": "methodApplePay",
  "google-pay": "methodGooglePay",
};

/**
 * The display label for a fixed catalog payment method, localized. Exported so
 * screens that reference a selected method outside the option list itself (the
 * checkout wallet toggle's "charged to X" line) render the same label.
 */
export function paymentMethodLabel(method: PaymentMethod, t: ReturnType<typeof useTranslations<"payment">>): string {
  const labelKey = LABEL_KEYS[method.id];
  return labelKey ? t(labelKey) : method.label;
}

/** A single selectable payment method, rendered as a design-system radio tile. */
export function PaymentMethodOption({ method, selected, onSelect }: PaymentMethodOptionProps) {
  const t = useTranslations("payment");
  const tCheckout = useTranslations("checkout");
  const label = paymentMethodLabel(method, t);

  return (
    <SelectableTile
      name="payment-method"
      value={method.id}
      selected={selected}
      onSelect={() => onSelect(method.id)}
      size="md"
      className={cn(styles.option, "min-h-[74px] gap-4 rounded-2xl border-border bg-background px-4 sm:min-h-[88px] sm:px-6", selected && "border-primary bg-primary/[0.025]")}
    >
      <span aria-hidden className={cn("flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-muted-strong", selected && "border-primary")}>{selected && <span className="size-3.5 rounded-full bg-primary" />}</span>
      <PaymentMethodIcon methodId={method.id} className="size-9" />
      <span className="flex flex-col text-base font-medium text-foreground sm:text-lg">{label}{method.id === "cash-on-delivery" && <span className="text-sm font-medium text-primary sm:text-base">{tCheckout("availableForOrder")}</span>}</span>
    </SelectableTile>
  );
}
