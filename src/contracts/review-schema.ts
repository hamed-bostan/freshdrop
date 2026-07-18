import { z } from "zod";

/**
 * The single source of truth for submitting a review, shared by the client flow and
 * the REST route handler (defensive re-validation — never trust the client). Only
 * the product + the user's input travel over the wire: the author's name/avatar are
 * taken from the session server-side, so they can't be spoofed.
 */
export const reviewSubmissionSchema = z.object({
  productId: z.string().trim().min(1, "productMissing"),
  rating: z.number().int().min(1, "ratingRequired").max(5, "ratingRequired"),
  comment: z.string().trim().max(2000, "commentTooLong").optional().default(""),
});

export type ReviewSubmissionInput = z.infer<typeof reviewSubmissionSchema>;
