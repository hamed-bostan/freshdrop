import { productImportRowSchema, type ResolvedProductImportRow } from "../../../contracts/product-import-schema";
import { ValidationError } from "../../errors/ValidationError";

import type { ZodError } from "zod";

/** How many data rows one import file may carry, separate from `MAX_BULK_PRODUCTS` — imports are naturally larger than a selected page. */
export const MAX_IMPORT_ROWS = 500;

/** Fields a *new* product (blank `id`) can't be created without — a partial update has no such list, since every blank cell just leaves the existing value alone. */
const REQUIRED_FOR_CREATE = ["name", "price", "imageUrl", "stockQuantity"] as const;

export type ProductImportRowError = { line: number; message: string };

export type ProductImportValidation = {
  valid: { line: number; row: ResolvedProductImportRow }[];
  errors: ProductImportRowError[];
};

/** What the route handler resolves in one query each, so validation never does one lookup per row. */
export type ProductImportLookups = {
  /** Category id or slug (lower-cased) → the real category id. */
  categoryByIdOrSlug: ReadonlyMap<string, string>;
  /** Ids from the file's `id` column that actually exist. */
  existingProductIds: ReadonlySet<string>;
};

/**
 * Validate every row of an uploaded product-import CSV, writing nothing.
 *
 * Two passes per row: the pure schema (price format, brand, dietary tags —
 * `productImportRowSchema`), then the lookups the caller already resolved in
 * bulk (does this id exist, does this category resolve). A row that fails
 * either becomes one entry in `errors`; a row that passes both becomes one
 * entry in `valid`, its `categoryIdOrSlug` cell replaced by the real
 * `categoryId` so the commit step never has to resolve it again.
 *
 * Framework-free and read-only — the caller supplies the lookups instead of
 * this reaching for a repository, so it stays testable without a database.
 */
export class ValidateProductImport {
  execute(
    dataRows: readonly (readonly string[])[],
    header: readonly string[],
    lookups: ProductImportLookups,
  ): ProductImportValidation {
    if (dataRows.length === 0) throw new ValidationError("file", "The file has no data rows.");
    if (dataRows.length > MAX_IMPORT_ROWS) {
      throw new ValidationError("file", `A file can import at most ${MAX_IMPORT_ROWS} rows.`);
    }

    const valid: { line: number; row: ResolvedProductImportRow }[] = [];
    const errors: ProductImportRowError[] = [];

    dataRows.forEach((cells, index) => {
      // The header is line 1, so the first data row is line 2 — the line
      // number a spreadsheet's own row indicator would show.
      const line = index + 2;
      if (cells.every((cell) => cell.trim() === "")) return; // a genuinely blank line, skipped rather than reported

      const parsed = productImportRowSchema.safeParse(toRecord(header, cells));
      if (!parsed.success) {
        errors.push({ line, message: describeIssues(parsed.error) });
        return;
      }
      const row = parsed.data;
      const isCreate = row.id === undefined;

      if (row.id !== undefined && !lookups.existingProductIds.has(row.id)) {
        errors.push({ line, message: `Unknown product id "${row.id}" — leave id blank to create a new product.` });
        return;
      }

      let categoryId: string | undefined;
      if (row.categoryIdOrSlug !== undefined) {
        categoryId = lookups.categoryByIdOrSlug.get(row.categoryIdOrSlug.toLowerCase());
        if (!categoryId) {
          errors.push({ line, message: `Unknown category "${row.categoryIdOrSlug}".` });
          return;
        }
      }

      if (isCreate) {
        const missing: string[] = REQUIRED_FOR_CREATE.filter((field) => row[field] === undefined);
        if (categoryId === undefined) missing.unshift("categoryIdOrSlug");
        if (missing.length > 0) {
          errors.push({ line, message: `Creating a new product requires: ${missing.join(", ")}.` });
          return;
        }
      }

      valid.push({
        line,
        row: {
          id: row.id,
          name: row.name,
          brand: row.brand,
          unit: row.unit,
          price: row.price,
          originalPrice: row.originalPrice,
          stockQuantity: row.stockQuantity,
          imageUrl: row.imageUrl,
          description: row.description,
          nutrition: row.nutrition,
          origin: row.origin,
          dietary: row.dietary,
          isFeatured: row.isFeatured,
          isPublished: row.isPublished,
          taxExempt: row.taxExempt,
          badge: row.badge,
          categoryId,
        },
      });
    });

    return { valid, errors };
  }
}

function toRecord(header: readonly string[], cells: readonly string[]): Record<string, string> {
  const record: Record<string, string> = {};
  header.forEach((key, i) => {
    record[key.trim()] = cells[i] ?? "";
  });
  return record;
}

/** English, plain-language row errors — the same standing as the domain's own `ValidationError` messages, which this codebase never routes through i18n either. */
function describeIssues(error: ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid row.";
  const field = String(issue.path[0] ?? "value");
  return `${field}: ${describeIssueCode(issue.message)}`;
}

const ISSUE_MESSAGES: Record<string, string> = {
  priceInvalid: "must be a valid price (e.g. 4.99)",
  stockWhole: "must be a whole number of 0 or more",
  brandInvalid: "is not a recognized brand",
  dietaryUnknown: "contains an unrecognized dietary tag",
  imageInvalid: "must be a valid image URL",
  nameTooLong: "must be 120 characters or fewer",
  booleanInvalid: "must be true/false, yes/no, or 1/0",
  originalPriceHigher: "must be higher than the price",
};

function describeIssueCode(code: string): string {
  return ISSUE_MESSAGES[code] ?? code;
}
