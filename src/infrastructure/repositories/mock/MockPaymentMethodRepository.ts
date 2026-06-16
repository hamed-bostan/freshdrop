import type { PaymentMethod } from "@/src/domain/entities/PaymentMethod";
import type { IPaymentMethodRepository } from "@/src/domain/repositories/IPaymentMethodRepository";

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "cash-on-delivery", label: "Cash On Delivery", group: "cash" },
  { id: "wallet", label: "Wallet", group: "wallet" },
  { id: "paypal", label: "PayPal", group: "options" },
  { id: "apple-pay", label: "Apple Pay", group: "options" },
  { id: "google-pay", label: "Google Pay", group: "options" },
];

export class MockPaymentMethodRepository implements IPaymentMethodRepository {
  async getAll(): Promise<PaymentMethod[]> {
    return PAYMENT_METHODS;
  }
}
