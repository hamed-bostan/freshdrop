import { useLocale, useTranslations } from "next-intl";

import type { PublicReview, ReviewStatus } from "@/src/domain/entities/Review";
import { Link } from "@/src/i18n/navigation";
import { formatOrderDate } from "@/src/lib/formatOrderDate";
import { Badge, RatingStars } from "@/src/presentation/design-system";

/** Moderation state → badge tone. Mirrors the moderation queue's own mapping. */
const STATUS_VARIANT: Record<ReviewStatus, "success" | "warning" | "neutral"> = {
  approved: "success",
  pending: "warning",
  rejected: "neutral",
};

type CustomerReviewsPanelProps = {
  /** Reviews this customer wrote, newest first, in every moderation status. */
  reviews: PublicReview[];
};

/**
 * What this customer has reviewed — every status, not just the approved ones the
 * storefront shows. The reason the panel exists is the moderation question ("is this
 * person leaving one-star reviews on everything?"), and a queue-filtered view of it
 * would hide exactly the rows that answer it, so each row wears its status.
 *
 * Each links to the product it's about rather than to the moderation queue: the
 * queue has no per-review route, and the product page is where the review's context
 * actually is.
 */
export function CustomerReviewsPanel({ reviews }: CustomerReviewsPanelProps) {
  const t = useTranslations("dashCustomerDetail");
  const locale = useLocale();

  if (reviews.length === 0) {
    return <p className="text-body-b6 text-muted-foreground">{t("noReviews")}</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {reviews.map((review) => (
        <li key={review.id} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-center gap-2">
            <RatingStars value={review.rating} size="sm" />
            <Badge variant={STATUS_VARIANT[review.status]} size="sm">
              {t(`reviewStatus.${review.status}`)}
            </Badge>
            <span className="ms-auto text-body-b6 text-muted-foreground">
              {formatOrderDate(review.createdAt, locale)}
            </span>
          </div>
          <p className="text-body-b6 text-foreground">{review.comment}</p>
          <Link
            href={`/dashboard/products/${review.productId}/edit`}
            className="w-fit text-body-b6 text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
          >
            {t("viewReviewedProduct")}
          </Link>
        </li>
      ))}
    </ul>
  );
}
