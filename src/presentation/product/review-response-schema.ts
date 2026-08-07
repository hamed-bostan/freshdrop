import { z } from "zod";

import type { PublicReview } from "@/src/domain/entities/Review";

/**
 * The shape a review endpoint promises to return, validated at the typed-service
 * boundary (see `parseApiResponse`). Shared by the storefront services (a product's
 * approved reviews, submitting one) and the dashboard's moderation queue — one
 * entity, one response contract.
 *
 * Distinct from the review *input* schemas (`components/review-schema.ts`,
 * `dashboard/reviews/review-moderation-schema.ts`): those describe what a customer
 * or admin may submit; this describes what the API sends back.
 *
 * A {@link PublicReview}, not a `Review`: the author's id never leaves the server
 * (it's their phone digits), so no endpoint sends it and nothing here parses it.
 */
export const reviewResponseSchema = z.object({
  id: z.string(),
  productId: z.string(),
  authorName: z.string(),
  authorAvatarUrl: z.string().optional(),
  rating: z.number(),
  // ISO 8601 on the wire — the entity keeps it a string and the presentation layer
  // formats it, so there's nothing to coerce here.
  createdAt: z.string(),
  comment: z.string(),
  status: z.enum(["pending", "approved", "rejected"]),
}) satisfies z.ZodType<PublicReview>;

export const reviewListResponseSchema = z.array(reviewResponseSchema);
