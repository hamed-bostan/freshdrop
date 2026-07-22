import { getTranslations } from "next-intl/server";
import type { PublicReview } from "@/src/domain/entities/Review";
import { ReviewItem } from "./ReviewItem";
import { AddReviewFlow } from "./AddReviewFlow";

interface ReviewSectionProps {
  productId: string;
  reviews: PublicReview[];
}

export async function ReviewSection({ productId, reviews }: ReviewSectionProps) {
  const t = await getTranslations("reviews");

  return (
    <section aria-labelledby="reviews-heading" className="flex flex-col gap-4">
      <h2 id="reviews-heading" className="text-body-b1 text-foreground">
        {t("heading")}
      </h2>

      {reviews.length > 0 ? (
        <div className="flex flex-col gap-5">
          {reviews.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <p className="text-body-b6 text-muted-foreground">{t("empty")}</p>
      )}

      <AddReviewFlow productId={productId} />
    </section>
  );
}
