import type { ActivityActor } from "../../entities/ActivityEntry";
import type { Product } from "../../entities/Product";
import type { ICategoryRepository } from "../../repositories/ICategoryRepository";
import type { IProductRepository, NewProduct } from "../../repositories/IProductRepository";
import type { IStockAlertRepository } from "../../repositories/IStockAlertRepository";
import type { IStockAlertNotifier } from "../../repositories/IStockAlertNotifier";
import type { ResolvedProductImportRow } from "../../../contracts/product-import-schema";
import { ValidationError } from "../../errors/ValidationError";
import { CreateProduct } from "../products/CreateProduct";
import { UpdateProduct } from "../products/UpdateProduct";
import { MAX_IMPORT_ROWS } from "./ValidateProductImport";

export type ProductImportCommitError = { line: number; message: string };

export type ProductImportResult = {
  created: number;
  updated: number;
  errors: ProductImportCommitError[];
};

/**
 * Commit a validated product-import file: one `CreateProduct` or `UpdateProduct`
 * call per row, reusing them rather than writing a second product-write path —
 * so a bulk-imported row gets the exact same domain guards, activity entry and
 * stock ledger write a single form save gets.
 *
 * Takes what `ValidateProductImport` already resolved (a real `categoryId`, a
 * real `id` when updating) but never trusts it: this re-checks the category
 * still exists and the product still exists, since the two calls happen in
 * separate requests and the catalog can change in between — a tampered or
 * stale client payload fails the same checks a fresh one would.
 *
 * Rows commit independently. Validation already ran as its own step, so by the
 * time a file reaches here every row is expected to succeed — but a row can
 * still lose a race (its category was deleted a second ago) or trip a domain
 * guard `CreateProduct`/`UpdateProduct` enforce directly, and one such row must
 * not roll back the rows around it.
 */
export class ImportProducts {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly categoryRepo: ICategoryRepository,
    private readonly stockAlerts: IStockAlertRepository,
    private readonly notifier: IStockAlertNotifier,
  ) {}

  async execute(
    rows: readonly { line: number; row: ResolvedProductImportRow }[],
    actor: ActivityActor,
  ): Promise<ProductImportResult> {
    if (rows.length === 0) throw new ValidationError("rows", "Nothing to import.");
    if (rows.length > MAX_IMPORT_ROWS) {
      throw new ValidationError("rows", `A file can import at most ${MAX_IMPORT_ROWS} rows.`);
    }

    const categoryIds = new Set((await this.categoryRepo.getAll()).map((category) => category.id));

    let created = 0;
    let updated = 0;
    const errors: ProductImportCommitError[] = [];

    for (const { line, row } of rows) {
      try {
        if (row.categoryId !== undefined && !categoryIds.has(row.categoryId)) {
          throw new ValidationError("categoryId", "That category no longer exists.");
        }

        if (row.id !== undefined) {
          const existing = await this.productRepo.getById(row.id);
          if (!existing) throw new ValidationError("id", `Product "${row.id}" no longer exists.`);
          await new UpdateProduct(this.productRepo, this.stockAlerts, this.notifier).execute(
            row.id,
            mergeProduct(existing, row),
            actor,
          );
          updated += 1;
        } else {
          await new CreateProduct(this.productRepo).execute(buildNewProduct(row), actor);
          created += 1;
        }
      } catch (error) {
        errors.push({ line, message: error instanceof Error ? error.message : "Import failed for this row." });
      }
    }

    return { created, updated, errors };
  }
}

/** Apply only the cells the row actually carried; every blank cell keeps the existing value. */
function mergeProduct(existing: Product, row: ResolvedProductImportRow): NewProduct {
  return {
    name: row.name ?? existing.name,
    price: row.price ?? existing.price,
    originalPrice: row.originalPrice ?? existing.originalPrice,
    stockQuantity: row.stockQuantity ?? existing.stockQuantity,
    imageUrl: row.imageUrl ?? existing.imageUrl,
    categoryId: row.categoryId ?? existing.categoryId,
    isFeatured: row.isFeatured ?? existing.isFeatured,
    isPublished: row.isPublished ?? existing.isPublished,
    badge: row.badge ?? existing.badge,
    unit: row.unit ?? existing.unit,
    description: row.description ?? existing.description,
    nutrition: row.nutrition ?? existing.nutrition,
    origin: row.origin ?? existing.origin,
    brand: row.brand ?? existing.brand,
    dietary: row.dietary ?? existing.dietary,
    taxExempt: row.taxExempt ?? existing.taxExempt,
    // `undefined` leaves existing translations untouched — CSV import carries no
    // translation columns in v1.
  };
}

/** A brand-new product. `ValidateProductImport` already required these fields when `id` is blank; re-checked here since this call is the one that actually trusts them. */
function buildNewProduct(row: ResolvedProductImportRow): NewProduct {
  if (row.name === undefined || row.price === undefined || row.imageUrl === undefined || row.stockQuantity === undefined) {
    throw new ValidationError("row", "Missing a required field to create a product.");
  }
  if (row.categoryId === undefined) throw new ValidationError("categoryId", "Choose a category.");

  return {
    name: row.name,
    price: row.price,
    originalPrice: row.originalPrice,
    stockQuantity: row.stockQuantity,
    imageUrl: row.imageUrl,
    categoryId: row.categoryId,
    isFeatured: row.isFeatured ?? false,
    isPublished: row.isPublished ?? true,
    badge: row.badge,
    unit: row.unit,
    description: row.description,
    nutrition: row.nutrition,
    origin: row.origin,
    brand: row.brand,
    dietary: row.dietary ?? [],
    taxExempt: row.taxExempt ?? true,
  };
}
