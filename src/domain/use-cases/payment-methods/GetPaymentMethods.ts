import type { PaymentMethod } from "../../entities/PaymentMethod";
import type { IPaymentMethodRepository } from "../../repositories/IPaymentMethodRepository";

export class GetPaymentMethods {
  constructor(private readonly paymentMethodRepo: IPaymentMethodRepository) {}

  execute(): Promise<PaymentMethod[]> {
    return this.paymentMethodRepo.getAll();
  }
}
