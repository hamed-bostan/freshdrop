import { singleChange } from "../../entities/ActivityEntry";
import { ValidationError } from "../../errors/ValidationError";

import type { ActivityActor } from "../../entities/ActivityEntry";
import type { Review, ReviewStatus } from "../../entities/Review";
import type { IReviewRepository } from "../../repositories/IReviewRepository";


/** How many reviews one bulk moderation may touch. */
const MAX_BULK_REVIEWS = 200;

/**
 * Approve or reject a selection of reviews at once — the moderation queue's bulk
 * action. Admin only.
 *
 * The queue is worked front to back and most of it is uncontroversial, so the
 * per-review decision {@link ModerateReview} models is the exception rather than the
 * rule; clearing thirty obviously-fine reviews one click at a time is how a queue
 * stops being worked at all.
 *
 * What doesn't change is the record: the repository writes one `review.moderated`
 * entry per review, carrying the status it moved from, exactly as the single-review
 * path does. A bulk action is a faster way to make the same decisions, not a
 * quieter one — nothing is attributable to "a batch" instead of to a person and a
 * review.
 */
export class BulkModerateReviews {
  constructor(private readonly reviewRepo: IReviewRepository) {}

  /**
   * Returns the reviews the change actually moved. Ids that don't exist, and
   * reviews already in the target status, are skipped — so the count can be lower
   * than `ids.length`, and that count is what the screen reports back.
   */
  async execute(
    ids: readonly string[],
    status: ReviewStatus,
    actor: ActivityActor,
  ): Promise<Review[]> {
    if (ids.length === 0) throw new ValidationError("ids", "Select at least one review.");
    if (ids.length > MAX_BULK_REVIEWS) {
      throw new ValidationError("ids", `Select at most ${MAX_BULK_REVIEWS} reviews.`);
    }

    const updates = await this.reviewRepo.updateStatusMany(ids, status, ({ review, previousStatus }) => ({
      actorId: actor.id,
      actorName: actor.name,
      action: "review.moderated",
      entityType: "review",
      entityId: review.id,
      // The author, not the comment — same reasoning as `ModerateReview`: the log
      // is scanned, and review text would push every other column off the screen.
      entityLabel: review.authorName,
      changes: singleChange("status", previousStatus, status),
    }));

    return updates.map((update) => update.review);
  }
}
