"use client";

import { useTranslations } from "next-intl";
import { SelectableTile } from "@/src/presentation/design-system";
import type { PaymentMethod } from "@/src/domain/entities/PaymentMethod";
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
  const label = paymentMethodLabel(method, t);

  return (
    <SelectableTile
      name="payment-method"
      value={method.id}
      selected={selected}
      onSelect={() => onSelect(method.id)}
      size="sm"
    >
      <PaymentMethodIcon methodId={method.id} />
      <span className="text-body-b6 text-foreground">{label}</span>
    </SelectableTile>
  );
}
