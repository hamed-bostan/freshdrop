import { z } from "zod";
import type { PublicReviewPage } from "@/src/domain/entities/AdminReviewFilters";
import { serverApiGet } from "@/src/lib/api/server-client";
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
const reviewPageResponseSchema = pageResponseSchema(reviewResponseSchema).and(
  z.object({
    counts: z.object({
      pending: z.number(),
      approved: z.number(),
      rejected: z.number(),
      all: z.number(),
    }),
  }),
) as z.ZodType<PublicReviewPage>;

/**
 * Server-side review reads for the admin dashboard (BFF). Unlike the storefront's
 * `reviewsServerApi` (a product's approved reviews), this hits the admin endpoint
 * for the cross-product moderation queue in every status. `serverApiGet` forwards
 * the admin's session cookie. Moderation goes through the browser `reviewsApi`,
 * which then `router.refresh()`es to re-run this read.
 */
export const reviewsServerApi = {
  /** One page of the queue, with the filters and ordering the caller's query string carries. */
  listPage(params: URLSearchParams): Promise<PublicReviewPage> {
    return serverApiGet("/admin/reviews", reviewPageResponseSchema, {
      params: Object.fromEntries(params),
    });
  },
};
