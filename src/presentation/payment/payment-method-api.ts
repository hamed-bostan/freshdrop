import { apiClient } from "@/src/lib/api/client";
import type { SelectPaymentMethodInput } from "./payment-method-schema";

/**
 * Typed client for the payment-method REST *mutations*. UI components call these
 * instead of touching Axios directly; each resolves with domain data or rejects with
 * an `ApiError` (normalized by the Axios response interceptor in `client.ts`). Reads
 * are server-side (see `paymentMethodsServerApi`).
 */
export const paymentMethodsApi = {
  /** Persist the user's selected checkout payment method; resolves with the stored id. */
  async select(methodId: string): Promise<string> {
    const { data } = await apiClient.put<{ selectedId: string }>("/payment-methods/selected", {
      methodId,
    } satisfies SelectPaymentMethodInput);
    return data.selectedId;
  },
};
