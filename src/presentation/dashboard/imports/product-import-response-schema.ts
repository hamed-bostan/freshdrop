import { z } from "zod";
import { resolvedProductImportRowSchema } from "@/src/contracts/product-import-schema";

/** What the client got back from the file it uploaded, plus a per-row error list. Only the frontend reads this shape, so it stays colocated with the feature rather than in `contracts/`. */
export const productImportValidationResponseSchema = z.object({
  total: z.number(),
  valid: z.array(z.object({ line: z.number(), row: resolvedProductImportRowSchema })),
  errors: z.array(z.object({ line: z.number(), message: z.string() })),
});

export type ProductImportValidationResponse = z.infer<typeof productImportValidationResponseSchema>;

/** What committing the previously validated rows actually did. */
export const productImportCommitResponseSchema = z.object({
  created: z.number(),
  updated: z.number(),
  errors: z.array(z.object({ line: z.number(), message: z.string() })),
});

export type ProductImportCommitResponse = z.infer<typeof productImportCommitResponseSchema>;
