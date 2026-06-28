import type { PaymentMethod } from "../entities/PaymentMethod";

export type IPaymentMethodRepository = {
  getAll(): Promise<PaymentMethod[]>;
}
