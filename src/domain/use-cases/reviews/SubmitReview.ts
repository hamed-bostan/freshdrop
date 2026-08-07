import { NotifyAdmins } from "../notifications/NotifyAdmins";

import type { Review } from "../../entities/Review";
import type { IAdminNotificationRepository } from "../../repositories/IAdminNotificationRepository";
import type { IEmailSender } from "../../repositories/IEmailSender";
import type { INotificationTemplateRepository } from "../../repositories/INotificationTemplateRepository";
import type { IReviewRepository, NewReview } from "../../repositories/IReviewRepository";
import type { IUserRepository } from "../../repositories/IUserRepository";

/**
 * Persist a customer review for a product. The author's name/avatar are snapshotted
 * from the signed-in session by the caller (the route handler) — never trusted from
 * the client — and the rating/comment come from the validated form input.
 */
export class SubmitReview {
  constructor(
    private readonly reviewRepo: IReviewRepository,
    private readonly userRepo: IUserRepository,
    private readonly adminNotifications: IAdminNotificationRepository,
    private readonly emailSender: IEmailSender,
    private readonly templateRepo: INotificationTemplateRepository,
  ) {}

  async execute(input: NewReview): Promise<Review> {
    const review = await this.reviewRepo.create(input);

    // New reviews start `pending` — tell whoever moderates them. Best-effort:
    // the review is already recorded regardless of the fan-out's outcome.
    await new NotifyAdmins(this.userRepo, this.adminNotifications, this.emailSender, this.templateRepo).execute(
      "reviews.moderate",
      {
        action: "review.submitted",
        entityType: "review",
        entityId: review.id,
        actorId: review.authorId ?? undefined,
        actorName: input.authorName,
      },
    );

    return review;
  }
}
