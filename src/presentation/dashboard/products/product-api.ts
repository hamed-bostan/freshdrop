import type { Product } from "@/src/domain/entities/Product";
import { apiClient } from "@/src/lib/api/client";
import type { ProductFormInput } from "./product-schema";

/**
 * Typed client for the product REST *mutations*. UI components call these instead
 * of touching Axios directly; each method resolves with domain data or rejects
 * with an `ApiError` (normalized by the Axios response interceptor in `client.ts`).
 * Reads are server-side (see `productsServerApi`).
 *
 * The wire payload is the form's *input* shape (`ProductFormInput`, strings) — the
 * `productFormSchema` on the route handler is what coerces it to the numeric domain
 * model, keeping the schema the single validation contract for both sides.
 */
export const productsApi = {
  async create(values: ProductFormInput): Promise<Product> {
    const { data } = await apiClient.post<Product>("/products", values);
    return data;
  },

  async update(id: string, values: ProductFormInput): Promise<Product> {
    const { data } = await apiClient.put<Product>(`/products/${id}`, values);
    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  },
};
