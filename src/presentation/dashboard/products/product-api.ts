import { bulkResultSchema, type BulkResult, type ProductBulkAction } from "@/src/contracts/bulk-action-schema";
import type { ProductFormInput } from "@/src/contracts/product-schema";
import type { StockAdjustmentInput } from "@/src/contracts/stock-adjustment-schema";
import type { Product } from "@/src/domain/entities/Product";
import { apiDelete, apiPatch, apiPost, apiPut } from "@/src/lib/api/client";
import { productResponseSchema } from "@/src/presentation/product/product-response-schema";

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

  /**
   * Move a product's stock by a signed delta, with a reason. The narrow endpoint,
   * not `update` — adjusting a level from the catalog list must not send (or
   * overwrite) the rest of a product the operator isn't touching.
   *
   * Takes the form's *input* shape (direction + amount as strings); the contract
   * schema on the route handler is what turns it into the signed delta the domain
   * works in. Resolves with the product as it now stands.
   */
  adjustStock(id: string, values: StockAdjustmentInput): Promise<Product> {
    return apiPatch(`/products/${id}/stock`, values, productResponseSchema);
  },

  /**
   * Apply one change to a selection of products — publish, unpublish, or move to a
   * category. Resolves with how many products actually changed, which can be fewer
   * than were selected (some already held the value), so the caller reports the
   * returned count rather than the size of its own selection.
   */
  bulkUpdate(ids: readonly string[], action: ProductBulkAction): Promise<BulkResult> {
    return apiPatch("/admin/products/bulk", { ids, action }, bulkResultSchema);
  },
};
