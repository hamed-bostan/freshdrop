import type { Product } from "@/src/domain/entities/Product";
import { apiDelete, apiPost, apiPut } from "@/src/lib/api/client";
import { productResponseSchema } from "@/src/presentation/product/product-response-schema";
import type { ProductFormInput } from "./product-schema";

/**
 * Typed client for the product REST *mutations*. UI components call these instead
 * of touching Axios directly; each method resolves with domain data — validated
 * against `productResponseSchema` — or rejects with an `ApiError`.
 * Reads are server-side (see `productsServerApi`).
 *
 * The wire payload is the form's *input* shape (`ProductFormInput`, strings) — the
 * `productFormSchema` on the route handler is what coerces it to the numeric domain
 * model, keeping the schema the single validation contract for both sides. What
 * comes *back* is the stored product, so it's checked against the response schema
 * instead: the two describe different shapes and neither stands in for the other.
 */
export const productsApi = {
  create(values: ProductFormInput): Promise<Product> {
    return apiPost("/products", values, productResponseSchema);
  },

  update(id: string, values: ProductFormInput): Promise<Product> {
    return apiPut(`/products/${id}`, values, productResponseSchema);
  },

  remove(id: string): Promise<void> {
    return apiDelete(`/products/${id}`);
  },
};
