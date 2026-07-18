import { apiPut } from "@/src/lib/api/client";
import { storedPaymentMethodResponseSchema } from "./payment-method-response-schema";
import type { SelectPaymentMethodInput } from "@/src/contracts/payment-method-schema";

/**
 * Typed client for the payment-method REST *mutations*. UI components call these
 * instead of touching Axios directly; each resolves with domain data — validated
 * against the endpoint's response schema — or rejects with an `ApiError`. Reads are
 * server-side (see `paymentMethodsServerApi`).
 */
export const paymentMethodsApi = {
  /** Persist the user's selected checkout payment method; resolves with the stored id. */
  async select(methodId: string): Promise<string> {
    const { selectedId } = await apiPut(
      "/payment-methods/selected",
      { methodId } satisfies SelectPaymentMethodInput,
      storedPaymentMethodResponseSchema,
    );
    return selectedId;
  },
};
