import type { AdminProductFilters, AdminProductSort } from "@/src/domain/entities/AdminProductFilters";
import type { Product } from "@/src/domain/entities/Product";
import { getStockStatus } from "@/src/domain/entities/stock";
import type { IProductRepository } from "@/src/domain/repositories/IProductRepository";
import type { CsvValue } from "@/src/lib/csv";
import type { ReportDataset } from "@/src/lib/export-formats/report-dataset";
import { ExportProducts } from "../ExportProducts";

/**
 * The products report's one section — moved verbatim from
 * `app/api/admin/exports/products/route.ts`. See `OrdersDataset` for why
 * this file, not the route, is the source of truth for its columns.
 */
export function buildProductsDataset(
  deps: { products: IProductRepository },
  filters: AdminProductFilters,
  sort: AdminProductSort | undefined,
): ReportDataset {
  const products = new ExportProducts(deps.products).execute(filters, sort);
  return {
    title: "products",
    // Snapshot of the current catalog, not a period.
    period: null,
    sections: [{ id: "products", heading: "Products", header: HEADER, rows: toRows(products) }],
  };
}

/**
 * `stock_level` carries the domain's own classification rather than leaving
 * the reader to compare `stock_quantity` against a threshold they'd have to
 * know — so the file says "low" exactly where the dashboard does.
 */
const HEADER = [
  "id",
  "name",
  "category_id",
  "brand",
  "unit",
  "price",
  "original_price",
  "discount_percent",
  "stock_quantity",
  "stock_level",
  "rating",
  "rating_count",
  "is_featured",
] as const;

async function* toRows(products: AsyncIterable<Product>): AsyncGenerator<CsvValue[]> {
  for await (const product of products) {
    yield [
      product.id,
      product.name,
      product.categoryId,
      product.brand ?? "",
      product.unit ?? "",
      product.price,
      product.originalPrice ?? "",
      product.discountPercent ?? "",
      product.stockQuantity,
      getStockStatus(product.stockQuantity).level,
      product.rating,
      product.ratingCount,
      product.isFeatured,
    ];
  }
}
