import { z } from "zod";

/**
 * The single source of truth for moderating a review, shared by the dashboard
 * actions and the admin REST route (defensive re-validation — never trust the
 * client). An admin can only approve or reject; "pending" is the submission-time
 * default, not something the moderator sets.
 */
export const reviewModerationSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

export type ReviewModerationInput = z.infer<typeof reviewModerationSchema>;
