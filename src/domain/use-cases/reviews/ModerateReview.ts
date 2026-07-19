import type { ActivityActor } from "../../entities/ActivityEntry";
import { singleChange } from "../../entities/ActivityEntry";
import type { Review, ReviewStatus } from "../../entities/Review";
import type { IActivityLog } from "../../repositories/IActivityLog";
import type { IReviewRepository } from "../../repositories/IReviewRepository";
import { NotFoundError } from "../../errors/NotFoundError";
import { recordActivity } from "../activity/recordActivity";

/**
 * Set a review's moderation status (admin). Approving a review reveals it on the
 * storefront and folds it into the product's rating; rejecting hides it. The
 * repository recomputes the product's rating so it always reflects approved reviews.
 *
 * Moderation is a judgement call about someone else's words, made by one person
 * and visible to the public — exactly the kind of change the activity log is for:
 * which admin hid this review, when, and what state it was in before. Re-applying
 * the status a review already has records nothing, so a double-click on Approve is
 * one entry rather than two.
 */
export class ModerateReview {
  constructor(
    private readonly reviewRepo: IReviewRepository,
    private readonly activityLog: IActivityLog,
  ) {}

  async execute(id: string, status: ReviewStatus, actor: ActivityActor): Promise<Review> {
    // Read first: `updateStatus` resolves the row as written, so its status is
    // already the new one and the "before" would be lost. The read also turns an
    // unknown id into a 404 before anything is written, rather than relying on the
    // repository's P2025 mapping.
    const existing = await this.reviewRepo.getById(id);
    if (!existing) throw new NotFoundError("review", id);

    const moderated = await this.reviewRepo.updateStatus(id, status);

    if (existing.status !== status) {
      await recordActivity(this.activityLog, {
        actorId: actor.id,
        actorName: actor.name,
        action: "review.moderated",
        entityType: "review",
        entityId: moderated.id,
        // The author, not the comment: the log is scanned, and a paragraph of
        // review text would push every other column off the screen. The entry
        // carries the id for anyone who wants to go and read it.
        entityLabel: moderated.authorName,
        changes: singleChange("status", existing.status, status),
      });
    }

    return moderated;
  }
}
