import {
  DEFAULT_ADMIN_PRODUCT_DIRECTION,
  DEFAULT_ADMIN_PRODUCT_SORT,
} from "../../entities/AdminProductFilters";

import { streamAllPages } from "./streamAllPages";

import type { AdminProductFilters, AdminProductSort } from "../../entities/AdminProductFilters";
import type { Product } from "../../entities/Product";
import type { IProductRepository } from "../../repositories/IProductRepository";


/**
 * Every catalog product matching `filters`, one at a time. Backs
 * `GET /api/admin/exports/products`.
 *
 * Reads through the management list's own `listPage` with its own filters, so an
 * export is the screen's rows as a file — see {@link ExportOrders} for why that
 * matters. Notably this makes `?stock=needsRestock` an export of the restocking
 * round, which is the reason an operator wants a products CSV at all.
 *
 * No `locale` is passed, so the canonical (base row) copy is exported rather than a
 * translation. An export is a working file — it gets edited and read back against
 * the catalog — and a Persian product name in it would not match the row it
 * describes. The same reason the dashboard's reads are canonical.
 */
export class ExportProducts {
  constructor(private readonly products: IProductRepository) {}

  execute(filters: AdminProductFilters, sort?: AdminProductSort): AsyncGenerator<Product> {
    return streamAllPages<Product, AdminProductSort>(
      (page) => this.products.listPage(filters, page),
      {
        sort: sort ?? DEFAULT_ADMIN_PRODUCT_SORT,
        direction: DEFAULT_ADMIN_PRODUCT_DIRECTION,
      },
    );
  }
}
