import type { Product } from "@/src/domain/entities/Product";
import type { ProductTranslationInput } from "@/src/domain/repositories/IProductRepository";
import { ApiError } from "@/src/lib/api/ApiError";
import { serverApiGet } from "@/src/lib/api/server-client";

/**
 * Server-side product reads for the dashboard (BFF). Fetched during server render
 * so the data arrives with the page instead of after a client round-trip.
 * Mutations go through the browser `productsApi`, which then `router.refresh()`es
 * to re-run these reads.
 */
export const productsServerApi = {
  list(): Promise<Product[]> {
    // Canonical reads: the dashboard manages and edits the base (default-locale) row.
    return serverApiGet<Product[]>("/products", { canonical: true });
  },

  /** Resolve a product by id; `null` on 404 so callers can `notFound()`. */
  async getById(id: string): Promise<Product | null> {
    try {
      return await serverApiGet<Product>(`/products/${id}`, { canonical: true });
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
