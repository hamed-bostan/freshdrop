import { apiPost } from "@/src/lib/api/client";
import type { ResolvedProductImportRow } from "@/src/contracts/product-import-schema";
import {
  productImportCommitResponseSchema,
  productImportValidationResponseSchema,
  type ProductImportCommitResponse,
  type ProductImportValidationResponse,
} from "./product-import-response-schema";

/**
 * Typed client for the bulk product-import endpoints. Two calls, mirroring the
 * validate → confirm UX: `validate` uploads the file and writes nothing;
 * `commit` sends back exactly the rows `validate` returned as `valid` (not the
 * file again) and is the one that actually creates/updates products.
 */
export const productImportApi = {
  validate(file: File): Promise<ProductImportValidationResponse> {
    const body = new FormData();
    body.append("file", file);
    return apiPost("/admin/imports/products", body, productImportValidationResponseSchema);
  },

  commit(rows: readonly { line: number; row: ResolvedProductImportRow }[]): Promise<ProductImportCommitResponse> {
    return apiPost("/admin/imports/products/commit", { rows }, productImportCommitResponseSchema);
  },
};
