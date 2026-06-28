/**
 * A payment method the customer can pay with.
 *
 * `group` drives how the method is bucketed under a section on the payment
 * screen ("Cash", "Wallet", "Payment Options"). The presentation layer owns the
 * icon and section-title mapping so the domain stays free of UI concerns —
 * mirroring how `DeliveryLocation.kind` is mapped to an icon in the UI.
 */
export type PaymentMethodGroup = "cash" | "wallet" | "card" | "options";

export type PaymentMethod = {
  id: string;
  label: string;
  group: PaymentMethodGroup;
}
