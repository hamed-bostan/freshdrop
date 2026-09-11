import { z } from "zod";

import { DIETARY_TAGS, PRODUCT_BRANDS } from "@/src/domain/entities/ProductFilters";

import { PRICE_PATTERN } from "./product-schema";

const DIETARY_SET = new Set<string>(DIETARY_TAGS);
const BRAND_SET = new Set<string>(PRODUCT_BRANDS);
const TRUE_VALUES = new Set(["true", "1", "yes"]);
const FALSE_VALUES = new Set(["false", "0", "no"]);

/**
 * Bulk product import — the CSV route handlers and the client preview panel
 * share this contract, per the same defensive-re-validation rule as
 * `product-schema.ts`.
 *
 * Every column is an optional string cell — that's all a CSV can carry — and a
 * blank cell means "leave unchanged" on update / "omit" on create, never a
 * clearing sentinel (there is no way to blank out a field via import in v1).
 * That's why the field validators here parallel `productFormSchema`'s but each
 * treats an empty cell as `undefined` instead of a validation failure: required-
 * ness is conditional on whether the row is creating or updating, which this
 * schema can't know (it has no `id` context) — the use-case enforces that once
 * it does.
 */

const blankToUndefined = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const optionalTextCell = z.string().transform(blankToUndefined);

const nameCell = z
  .string()
  .transform(blankToUndefined)
  .refine((value) => value === undefined || value.length <= 120, "nameTooLong");

const optionalPriceCell = z
  .string()
  .transform(blankToUndefined)
  .refine((value) => value === undefined || PRICE_PATTERN.test(value), "priceInvalid")
  .transform((value) => (value === undefined ? undefined : Number(value)));

const optionalStockCell = z
  .string()
  .transform(blankToUndefined)
  .refine((value) => value === undefined || /^\d+$/.test(value), "stockWhole")
  .transform((value) => (value === undefined ? undefined : Number(value)));

const optionalUrlCell = z
  .string()
  .transform(blankToUndefined)
  .refine((value) => value === undefined || isValidUrl(value), "imageInvalid");

const optionalBrandCell = z
  .string()
  .transform(blankToUndefined)
  .refine((value) => value === undefined || BRAND_SET.has(value), "brandInvalid");

const optionalDietaryCell = z
  .string()
  .transform(blankToUndefined)
  .transform((value) => (value === undefined ? undefined : value.split(",").map((tag) => tag.trim()).filter(Boolean)))
  .refine((tags) => tags === undefined || tags.every((tag) => DIETARY_SET.has(tag)), "dietaryUnknown");

/** A cell meaning yes/no. Blank leaves the field alone (or unset on create); anything else must be a recognized spelling. */
const optionalBooleanCell = z
  .string()
  .transform(blankToUndefined)
  .refine(
    (value) => value === undefined || TRUE_VALUES.has(value.toLowerCase()) || FALSE_VALUES.has(value.toLowerCase()),
    "booleanInvalid",
  )
  .transform((value) => (value === undefined ? undefined : TRUE_VALUES.has(value.toLowerCase())));

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * One CSV row, syntactically validated — no database access here (that's the
 * use-case's job, once it has a category/id lookup). `id` blank means create;
 * present means update, and must resolve to an existing product. `categoryIdOrSlug`
 * accepts either a raw category id or its slug.
 */
export const productImportRowSchema = z
  .object({
    id: optionalTextCell,
    name: nameCell,
    categoryIdOrSlug: optionalTextCell,
    brand: optionalBrandCell,
    unit: optionalTextCell,
    price: optionalPriceCell,
    originalPrice: optionalPriceCell,
    stockQuantity: optionalStockCell,
    imageUrl: optionalUrlCell,
    description: optionalTextCell,
    nutrition: optionalTextCell,
    origin: optionalTextCell,
    dietary: optionalDietaryCell,
    isFeatured: optionalBooleanCell,
    isPublished: optionalBooleanCell,
    taxExempt: optionalBooleanCell,
    badge: optionalTextCell,
  })
  // Only checked when both cells are present in *this* row — an update that
  // only touches one of the two can't be validated against the other without
  // the existing product, which this schema doesn't have. Documented gap, not
  // a silent one: see `ValidateProductImport`.
  .refine((row) => row.originalPrice === undefined || row.price === undefined || row.originalPrice > row.price, {
    path: ["originalPrice"],
    message: "originalPriceHigher",
  });

/** Column order for the downloadable template — also the accepted header names. */
export const PRODUCT_IMPORT_COLUMNS = [
  "id",
  "name",
  "categoryIdOrSlug",
  "brand",
  "unit",
  "price",
  "originalPrice",
  "stockQuantity",
  "imageUrl",
  "description",
  "nutrition",
  "origin",
  "dietary",
  "isFeatured",
  "isPublished",
  "taxExempt",
  "badge",
] as const;

export type ProductImportRow = z.output<typeof productImportRowSchema>;

/**
 * A row once its category has resolved to a real id — what the validate
 * endpoint hands back to the client, and what the commit endpoint receives
 * and re-validates. Shared rather than inferred per-endpoint so both sides of
 * the validate → confirm round trip agree on the wire shape.
 */
export const resolvedProductImportRowSchema = z.object({
  id: z.string().optional(),
  name: z.string().max(120).optional(),
  categoryId: z.string().optional(),
  brand: z.string().optional(),
  unit: z.string().optional(),
  price: z.number().positive().optional(),
  originalPrice: z.number().positive().optional(),
  stockQuantity: z.number().int().nonnegative().optional(),
  imageUrl: z.string().url().optional(),
  description: z.string().optional(),
  nutrition: z.string().optional(),
  origin: z.string().optional(),
  dietary: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  taxExempt: z.boolean().optional(),
  badge: z.string().optional(),
});

export type ResolvedProductImportRow = z.infer<typeof resolvedProductImportRowSchema>;

/** The request body `POST /api/admin/imports/products/commit` accepts. */
export const commitProductImportSchema = z.object({
  rows: z
    .array(z.object({ line: z.number().int().positive(), row: resolvedProductImportRowSchema }))
    .min(1, "selectionRequired"),
});

export type CommitProductImportRequest = z.infer<typeof commitProductImportSchema>;
