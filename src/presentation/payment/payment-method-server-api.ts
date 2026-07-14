import type { PaymentMethod } from "@/src/domain/entities/PaymentMethod";
import { serverApiGet } from "@/src/lib/api/server-client";
import {
  paymentMethodListResponseSchema,
  selectedPaymentMethodResponseSchema,
} from "./payment-method-response-schema";

/**
 * Server-side payment-method read for Server Components (BFF). The storefront
 * fetches the payment-option catalog over REST during render rather than touching
 * the data layer directly.
 */
export const paymentMethodsServerApi = {
  list(): Promise<PaymentMethod[]> {
    return serverApiGet("/payment-methods", paymentMethodListResponseSchema);
  },

  /**
   * The signed-in user's selected checkout payment method id (a catalog option or
   * saved card id), or `null` when unset. Per-user — `serverApiGet` forwards the
   * request cookies so the endpoint resolves the caller's own selection.
   */
  async getSelectedId(): Promise<string | null> {
    const { selectedId } = await serverApiGet("/payment-methods/selected", selectedPaymentMethodResponseSchema);
    return selectedId;
  },
};
