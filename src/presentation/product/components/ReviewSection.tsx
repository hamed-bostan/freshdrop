import type { Review } from "@/src/domain/entities/Review";
import { ReviewItem } from "./ReviewItem";
import { AddReviewFlow } from "./AddReviewFlow";

interface ReviewSectionProps {
  reviews: Review[];
}

export function ReviewSection({ reviews }: ReviewSectionProps) {
  return (
    <section aria-labelledby="reviews-heading" className="flex flex-col gap-4">
      <h2 id="reviews-heading" className="text-body-b1 text-foreground">
        Reviews
      </h2>

      {reviews.length > 0 ? (
        <div className="flex flex-col gap-5">
          {reviews.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <p className="text-body-b6 text-muted-foreground">No reviews yet. Be the first to share your thoughts.</p>
      )}

      <AddReviewFlow />
    </section>
  );
}
