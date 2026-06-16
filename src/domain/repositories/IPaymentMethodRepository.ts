import type { PaymentMethod } from "../entities/PaymentMethod";

export interface IPaymentMethodRepository {
  getAll(): Promise<PaymentMethod[]>;
}
