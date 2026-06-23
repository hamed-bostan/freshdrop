import Image from "next/image";
import { Star } from "lucide-react";
import { Icon } from "@/src/presentation/design-system";
import { formatRelativeTime } from "@/src/lib/formatRelativeTime";
import type { Review } from "@/src/domain/entities/Review";

interface ReviewItemProps {
  review: Review;
}

/** Two leading initials, e.g. "Leonardo DiCaprio" → "LD". */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ReviewItem({ review }: ReviewItemProps) {
  return (
    <article className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {review.authorAvatarUrl ? (
            <Image
              src={review.authorAvatarUrl}
              alt=""
              width={40}
              height={40}
              className="size-10 rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="grid size-10 place-items-center rounded-full bg-accent text-body-b8 text-accent-foreground"
            >
              {getInitials(review.authorName)}
            </span>
          )}

          <div className="flex flex-col">
            <span className="text-body-b8 text-foreground">{review.authorName}</span>
            <span className="text-body-b10 text-muted-foreground">{formatRelativeTime(review.createdAt)}</span>
          </div>
        </div>

        <span className="flex shrink-0 items-center gap-1">
          <Icon icon={Star} size="xs" className="fill-rating text-rating" />
          <span className="text-body-b8 text-foreground">{review.rating}</span>
        </span>
      </div>

      <p className="text-body-b6 text-muted-foreground">{review.comment}</p>
    </article>
  );
}
