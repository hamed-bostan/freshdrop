import { z } from "zod";
import type { PublicReviewPage } from "@/src/domain/entities/AdminReviewFilters";
import { pageResponseSchema } from "@/src/lib/api/page-response-schema";
import { reviewResponseSchema } from "@/src/presentation/product/review-response-schema";

/**
 * What `GET /api/admin/reviews` promises: a page of reviews plus the per-status
 * counts the queue's tabs display.
 *
 * `pageResponseSchema` gives the envelope; the counts are intersected on rather
 * than folded into it, because they're specific to this queue — no other list has
 * tabs to count for.
 */
export const reviewPageResponseSchema = pageResponseSchema(reviewResponseSchema).and(
  z.object({
    counts: z.object({
      pending: z.number(),
      approved: z.number(),
      rejected: z.number(),
      all: z.number(),
    }),
  }),
) as z.ZodType<PublicReviewPage>;
