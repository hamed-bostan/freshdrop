import type { SavedCard, Wallet } from "@/src/domain/entities/Wallet";
import { serverApiGet } from "@/src/lib/api/server-client";

import { savedCardListResponseSchema, walletResponseSchema } from "./wallet-response-schema";

/**
 * Server-side wallet reads for Server Components (BFF). `serverApiGet` forwards the
 * request cookies, so these resolve the caller's own wallet over REST during render
 * rather than touching the data layer directly.
 */
export const walletsServerApi = {
  /** The signed-in user's wallet: balance + saved cards + recent transactions. */
  get(): Promise<Wallet> {
    return serverApiGet("/wallet", walletResponseSchema);
  },

  /** The signed-in user's saved cards alone (for the payment-methods screen). */
  listCards(): Promise<SavedCard[]> {
    return serverApiGet("/wallet/cards", savedCardListResponseSchema);
  },
};
