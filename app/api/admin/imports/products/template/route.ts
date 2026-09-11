import { PRODUCT_IMPORT_COLUMNS } from "@/src/contracts/product-import-schema";
import { unauthorizedResponse } from "@/src/lib/api/responses";
import { csvFilename, csvResponse, csvStream } from "@/src/lib/csv";
import { getSessionWith } from "@/src/lib/require-permission";

export const dynamic = "force-dynamic";

/** One filled-in example row, so the template shows the expected shape rather than just column names. */
const EXAMPLE_ROW: Record<(typeof PRODUCT_IMPORT_COLUMNS)[number], string> = {
  id: "",
  name: "Organic Baby Spinach",
  categoryIdOrSlug: "produce",
  brand: "",
  unit: "200g bag",
  price: "4.99",
  originalPrice: "",
  stockQuantity: "50",
  imageUrl: "https://example.com/spinach.jpg",
  description: "",
  nutrition: "",
  origin: "",
  dietary: "Vegan,Organic",
  isFeatured: "false",
  isPublished: "true",
  taxExempt: "true",
  badge: "",
};

async function* exampleRows(): AsyncGenerator<readonly string[]> {
  yield PRODUCT_IMPORT_COLUMNS.map((column) => EXAMPLE_ROW[column]);
}

/**
 * GET /api/admin/imports/products/template — a downloadable starter CSV with
 * the import's column headers and one filled-in example row. Admin only.
 *
 * Header matches the *import* schema's columns, not the export's — the two are
 * intentionally asymmetric (see the bulk-import plan): export favours a quick
 * spreadsheet glance at the catalog, import needs every field a product write
 * can carry.
 */
export async function GET(): Promise<Response> {
  if (!(await getSessionWith("catalog.write"))) return unauthorizedResponse();

  return csvResponse(csvFilename("product-import-template"), csvStream(PRODUCT_IMPORT_COLUMNS, exampleRows()));
}
