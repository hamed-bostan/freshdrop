import { NextResponse, type NextRequest } from "next/server";
import { parseCsv } from "@/src/lib/csv";
import { ValidateProductImport } from "@/src/domain/use-cases/imports/ValidateProductImport";
import { categoryRepository, productRepository } from "@/src/infrastructure/container";
import { getSessionWith } from "@/src/lib/require-permission";
import { errorResponse, errorResponseFromException, unauthorizedResponse } from "@/src/lib/api/responses";

export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

/**
 * POST /api/admin/imports/products — validate an uploaded product CSV and
 * report what would happen, writing nothing. Admin only (`catalog.write`).
 *
 * The first half of the plan's validate → confirm round trip: a preview, never
 * a commit. `POST /api/admin/imports/products/commit` takes exactly the `valid`
 * array this responds with and is the only endpoint that writes.
 *
 * The category and existing-id lookups are each one query for the whole file,
 * not one per row — with up to `MAX_IMPORT_ROWS` rows, per-row lookups would be
 * the endpoint's real cost.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWith("catalog.write");
  if (!session) return unauthorizedResponse();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse(400, { message: "Expected multipart/form-data.", code: "BAD_REQUEST" });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return errorResponse(400, { message: "Missing 'file'.", code: "VALIDATION", fieldErrors: { file: "Required." } });
  }
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return errorResponse(400, { message: "Please upload a .csv file.", code: "VALIDATION", fieldErrors: { file: "Must be a .csv file." } });
  }
  if (file.size > MAX_FILE_BYTES) {
    return errorResponse(400, { message: "The file is too large (5 MB max).", code: "VALIDATION", fieldErrors: { file: "Too large." } });
  }

  const rows = parseCsv(await file.text());
  if (rows.length === 0) {
    return errorResponse(400, { message: "The file is empty.", code: "VALIDATION", fieldErrors: { file: "Empty file." } });
  }
  const [header, ...dataRows] = rows;

  const idIndex = header.findIndex((column) => column.trim() === "id");
  const candidateIds =
    idIndex === -1
      ? []
      : Array.from(new Set(dataRows.map((row) => row[idIndex]?.trim()).filter((value): value is string => !!value)));

  try {
    const [categories, existingProducts] = await Promise.all([
      categoryRepository.getAll(),
      candidateIds.length > 0 ? productRepository.getByIds(candidateIds) : Promise.resolve([]),
    ]);

    const categoryByIdOrSlug = new Map<string, string>();
    for (const category of categories) {
      categoryByIdOrSlug.set(category.id.toLowerCase(), category.id);
      categoryByIdOrSlug.set(category.slug.toLowerCase(), category.id);
    }
    const existingProductIds = new Set(existingProducts.map((product) => product.id));

    const result = new ValidateProductImport().execute(dataRows, header, { categoryByIdOrSlug, existingProductIds });
    return NextResponse.json({ total: dataRows.length, ...result });
  } catch (error) {
    return errorResponseFromException(error, "POST /api/admin/imports/products failed");
  }
}
