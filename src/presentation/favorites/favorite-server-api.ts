import type { Product } from "@/src/domain/entities/Product";
import { ApiError } from "@/src/lib/api/ApiError";
import { serverApiGet } from "@/src/lib/api/server-client";
import { productListResponseSchema } from "@/src/presentation/product/product-response-schema";

import { favoriteStatusResponseSchema } from "./favorite-response-schema";

/**
 * Server-side favorite reads for Server Components (BFF). `serverApiGet` forwards
 * the request cookies, so these see the caller's session.
 */
export const favoritesServerApi = {
  list(): Promise<Product[]> {
    return serverApiGet("/favorites", productListResponseSchema);
  },

  /** Whether a product is favorited. Returns `false` for anonymous users (401). */
  async isFavorite(productId: string): Promise<boolean> {
    try {
      const { favorited } = await serverApiGet(`/favorites/${productId}`, favoriteStatusResponseSchema);
      return favorited;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return false;
      throw error;
    }
  },
};
