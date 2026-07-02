import type { Product } from "@/src/domain/entities/Product";
import type { ProductFilters } from "@/src/domain/entities/ProductFilters";
import { ApiError } from "@/src/lib/api/ApiError";
import { buildProductFilterParams } from "@/src/lib/api/product-search-params";
import { serverApiGet } from "@/src/lib/api/server-client";

/**
 * Server-side product reads for Server Components (BFF) — fetched from the REST
 * API during server render, mirroring the storefront's category server service.
 */
export const productsServerApi = {
  listFeatured(): Promise<Product[]> {
    return serverApiGet<Product[]>("/products", { params: { featured: "true" } });
  },

  listSpecialOffers(): Promise<Product[]> {
    return serverApiGet<Product[]>("/products", { params: { special: "true" } });
  },

  listByCategory(categoryId: string): Promise<Product[]> {
    return serverApiGet<Product[]>("/products", { params: { categoryId } });
  },

  /**
   * Catalog search with filters (query, category, price, dietary, brand). An
   * all-empty filter resolves to no results. Filters are serialised into the URL
   * (`serverApiGet`'s `params` can't express the repeatable dietary/brand keys).
   */
  search(filters: ProductFilters): Promise<Product[]> {
    return serverApiGet<Product[]>(`/products?${buildProductFilterParams(filters).toString()}`);
  },

  listSimilar(id: string): Promise<Product[]> {
    return serverApiGet<Product[]>(`/products/${id}/similar`);
  },

  /** Returns `null` for a missing product (404) so callers can `notFound()`. */
  async getById(id: string): Promise<Product | null> {
    try {
      return await serverApiGet<Product>(`/products/${id}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
};
