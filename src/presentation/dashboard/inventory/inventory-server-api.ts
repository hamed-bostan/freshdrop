import { serverApiGet } from "@/src/lib/api/server-client";
import {
  stockMovementListResponseSchema,
  type StockMovementEntry,
} from "@/src/presentation/dashboard/products/stock-movement-response-schema";

/**
 * Server-side inventory reads for the admin dashboard (BFF). Read-only, and
 * deliberately not a mutation surface of its own: restocking a product still
 * goes through `productsApi.adjustStock` (see `NeedsRestockTable`), the same
 * ledgered path the catalog list's row action uses — this only reads the two
 * things the products feature has no screen for.
 */
export const inventoryServerApi = {
  /**
   * The store's most recent stock movements across every product, newest first —
   * what the inventory page's activity panel shows. Reuses the products feature's
   * wire schema: it's the same `StockMovement` entity, read across products
   * instead of one.
   */
  listRecentMovements(limit: number): Promise<StockMovementEntry[]> {
    return serverApiGet("/admin/inventory/movements", stockMovementListResponseSchema, {
      params: { limit: String(limit) },
    });
  },
};
