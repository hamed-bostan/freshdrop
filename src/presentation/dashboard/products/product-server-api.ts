import type { Product } from "@/src/domain/entities/Product";
import type { ProductTranslationInput } from "@/src/domain/repositories/IProductRepository";
import { ApiError } from "@/src/lib/api/ApiError";
import { serverApiGet } from "@/src/lib/api/server-client";
import { productListResponseSchema, productResponseSchema } from "@/src/presentation/product/product-response-schema";

/**
 * Server-side product reads for the dashboard (BFF). Fetched during server render
 * so the data arrives with the page instead of after a client round-trip.
 * Mutations go through the browser `productsApi`, which then `router.refresh()`es
 * to re-run these reads.
 */
export const productsServerApi = {
  list(): Promise<Product[]> {
    // Localized: the admin list is for reading, so it follows the active locale
    // (falling back to the base name where a product has no translation yet).
    return serverApiGet("/products", productListResponseSchema);
  },

  /**
   * Resolve a product by id; `null` on 404 so callers can `notFound()`.
   *
   * Canonical: this feeds the edit form, which writes back to the base row —
   * prefilling it with translated text would overwrite that row on save.
   */
  async getById(id: string): Promise<Product | null> {
    try {
      return await serverApiGet(`/products/${id}`, productResponseSchema, { canonical: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },

  /** The product's stored per-locale translations, to prefill the edit form. */
  getTranslations(id: string): Promise<ProductTranslationInput[]> {
    return serverApiGet<ProductTranslationInput[]>(`/products/${id}/translations`);
  },
};
