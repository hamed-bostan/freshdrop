import type { Page } from "@/src/domain/entities/Pagination";
import { pageResponseSchema } from "@/src/lib/api/page-response-schema";
import { serverApiGet } from "@/src/lib/api/server-client";
import {
  stockMovementListResponseSchema,
  type StockMovementEntry,
} from "@/src/presentation/dashboard/products/stock-movement-response-schema";

const movementPageResponseSchema = pageResponseSchema(stockMovementListResponseSchema.element);

/**
 * Server-side inventory reads for the admin dashboard (BFF). Read-only, and
 * deliberately not a mutation surface of its own: restocking a product still
 * goes through `productsApi.adjustStock` (see `InventoryProductsTable`), the same
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

  /** One URL-filtered page for the dedicated inventory ledger. */
  listMovementsPage(params: URLSearchParams): Promise<Page<StockMovementEntry>> {
    return serverApiGet("/admin/inventory/movements", movementPageResponseSchema, {
      params: Object.fromEntries(params),
    });
  },
};
