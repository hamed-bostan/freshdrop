import Image from "next/image";
import { useLocale } from "next-intl";
import { Star } from "lucide-react";
import { Avatar, Icon } from "@/src/presentation/design-system";
import { formatRelativeTime } from "@/src/lib/formatRelativeTime";
import { formatRating } from "@/src/lib/formatNumber";
import type { Review } from "@/src/domain/entities/Review";

interface ReviewItemProps {
  review: Review;
}

export function ReviewItem({ review }: ReviewItemProps) {
  const locale = useLocale();
  return (
    <article className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Avatar name={review.authorName} className="size-10">
            {review.authorAvatarUrl && (
              <Image
                src={review.authorAvatarUrl}
                alt=""
                width={40}
                height={40}
                className="size-full object-cover"
              />
            )}
          </Avatar>

          <div className="flex flex-col">
            <span className="text-body-b8 text-foreground">{review.authorName}</span>
            <span className="text-body-b10 text-muted-foreground">{formatRelativeTime(review.createdAt, locale)}</span>
          </div>
        </div>

        <span className="flex shrink-0 items-center gap-1">
          <Icon icon={Star} size="xs" className="fill-rating text-rating" />
          <span className="text-body-b8 text-foreground">{formatRating(review.rating, locale)}</span>
        </span>
      </div>

      <p className="text-body-b6 text-muted-foreground">{review.comment}</p>
    </article>
  );
}
