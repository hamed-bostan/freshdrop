import type { Product } from "@/src/domain/entities/Product";
import { apiClient } from "@/src/lib/api/client";

/**
 * Browser-side product search for the storefront's interactive typeahead.
 *
 * Storefront reads normally happen server-side over the BFF (`productsServerApi`),
 * with a Server Component as the single source of truth. Autocomplete is the
 * sanctioned exception: it fires per keystroke and must cancel stale requests, so
 * it fetches from the browser through the shared Axios client. Accepts an
 * `AbortSignal` so the caller drops an in-flight request when the query changes.
 */
export const productSearchApi = {
  async search(query: string, signal?: AbortSignal): Promise<Product[]> {
    const { data } = await apiClient.get<Product[]>("/products", {
      params: { q: query },
      signal,
    });
    return data;
  },
};
