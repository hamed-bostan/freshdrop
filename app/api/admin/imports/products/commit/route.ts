import { NextResponse, type NextRequest } from "next/server";
import { ImportProducts } from "@/src/domain/use-cases/imports/ImportProducts";
import { commitProductImportSchema } from "@/src/contracts/product-import-schema";
import {
  categoryRepository,
  productRepository,
  stockAlertNotifier,
  stockAlertRepository,
} from "@/src/infrastructure/container";
import { getSessionWith } from "@/src/lib/require-permission";
import {
  errorResponse,
  errorResponseFromException,
  firstFieldErrors,
  parseJsonBody,
  unauthorizedResponse,
} from "@/src/lib/api/responses";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/imports/products/commit — write the rows a prior
 * `POST /api/admin/imports/products` validated. Admin only (`catalog.write`).
 *
 * The body is the `valid` array the validate step returned, not the raw file —
 * the client already showed the admin what this will do; asking it to re-upload
 * the file here would let the two steps drift. The use-case re-checks the
 * category and (for updates) the product still exist, so a stale or tampered
 * payload fails the same way a fresh one that failed those checks would, rather
 * than being trusted.
 *
 * Each row commits independently via the existing `CreateProduct`/`UpdateProduct`
 * use-cases; a row that fails is reported in `errors` without rolling back the
 * rows that already succeeded (see `ImportProducts`).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWith("catalog.write");
  if (!session) return unauthorizedResponse();

  const body = await parseJsonBody(request);
  if (!body.ok) return errorResponse(400, { message: "Expected a JSON body.", code: "BAD_REQUEST" });

  const parsed = commitProductImportSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(400, {
      message: "Please fix the highlighted fields.",
      code: "VALIDATION",
      fieldErrors: firstFieldErrors(parsed.error),
    });
  }

  try {
    const result = await new ImportProducts(
      productRepository,
      categoryRepository,
      stockAlertRepository,
      stockAlertNotifier,
    ).execute(parsed.data.rows, { id: session.user.id, name: session.user.name ?? session.user.id });
    return NextResponse.json(result);
  } catch (error) {
    return errorResponseFromException(error, "POST /api/admin/imports/products/commit failed");
  }
}
