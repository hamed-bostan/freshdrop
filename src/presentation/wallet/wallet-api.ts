import type { SavedCard } from "@/src/domain/entities/Wallet";
import { apiPost } from "@/src/lib/api/client";
import { savedCardResponseSchema } from "./wallet-response-schema";
import type { AddCardInput, AddFundsInput } from "./wallet-schema";

/**
 * Browser client for wallet mutations. Components call these (never Axios directly);
 * each rejects with an `ApiError` — notably status `401` when the caller isn't
 * signed in. After a successful call the caller navigates and/or `router.refresh()`
 * so the server re-renders the authoritative wallet (never patch a local copy).
 */
export const walletsApi = {
  addFunds(values: AddFundsInput): Promise<void> {
    return apiPost("/wallet/funds", values);
  },

  addCard(values: AddCardInput): Promise<SavedCard> {
    return apiPost("/wallet/cards", values, savedCardResponseSchema);
  },
};
