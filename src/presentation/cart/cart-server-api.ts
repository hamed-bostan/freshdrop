import type { Cart } from "@/src/domain/entities/Cart";
import { serverApiGet } from "@/src/lib/api/server-client";

/**
 * Server-side cart read for Server Components (BFF). The storefront fetches the
 * cart over REST during render rather than touching the data layer directly.
 *
 * An applied promo `code` is forwarded so the server resolves it and returns
 * server-authoritative totals (subtotal, discount, total).
 */
export const cartsServerApi = {
  get(options?: { promo?: string | null }): Promise<Cart> {
    return serverApiGet<Cart>("/cart", options?.promo ? { params: { promo: options.promo } } : undefined);
  },
};
