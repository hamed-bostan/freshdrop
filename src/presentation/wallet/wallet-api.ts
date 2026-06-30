import type { SavedCard } from "@/src/domain/entities/Wallet";
import { apiClient } from "@/src/lib/api/client";
import type { AddCardInput, AddFundsInput } from "./wallet-schema";

/**
 * Browser client for wallet mutations. Components call these (never Axios directly);
 * each rejects with an `ApiError` — notably status `401` when the caller isn't
 * signed in. After a successful call the caller navigates and/or `router.refresh()`
 * so the server re-renders the authoritative wallet (never patch a local copy).
 */
export const walletsApi = {
  async addFunds(values: AddFundsInput): Promise<void> {
    await apiClient.post("/wallet/funds", values);
  },

  async addCard(values: AddCardInput): Promise<SavedCard> {
    const { data } = await apiClient.post<SavedCard>("/wallet/cards", values);
    return data;
  },
};
