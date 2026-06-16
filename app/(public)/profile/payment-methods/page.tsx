import { GetPaymentMethods } from "@/src/domain/use-cases/payment-methods/GetPaymentMethods";
import { paymentMethodRepository } from "@/src/infrastructure/container";
import PaymentMethodScreen from "@/src/presentation/payment/PaymentMethodScreen";

export default async function PaymentMethodsPage() {
  const methods = await new GetPaymentMethods(paymentMethodRepository).execute();

  return <PaymentMethodScreen methods={methods} />;
}
