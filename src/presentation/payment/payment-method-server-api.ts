import type { PaymentMethod } from "@/src/domain/entities/PaymentMethod";
import { serverApiGet } from "@/src/lib/api/server-client";

/**
 * Server-side payment-method read for Server Components (BFF). The storefront
 * fetches the payment-option catalog over REST during render rather than touching
 * the data layer directly.
 */
export const paymentMethodsServerApi = {
  list(): Promise<PaymentMethod[]> {
    return serverApiGet<PaymentMethod[]>("/payment-methods");
  },
};
