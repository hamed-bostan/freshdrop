import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import type { Review, ReviewStatus } from "@/src/domain/entities/Review";
import type { Product } from "@/src/domain/entities/Product";
import { Badge, Icon } from "@/src/presentation/design-system";
import { ReviewStatusSelect } from "./ReviewStatusSelect";

type ReviewsTableProps = {
  reviews: Review[];
  /** Product id → product, for the Product column's name + thumbnail. */
  productsById: Map<string, Product>;
};

// Fixed UTC formatters → deterministic output (identical on server and client), so
// the server-rendered submission date doesn't trigger a hydration mismatch — unlike
// relative time ("5 seconds ago"), which is computed against a moving "now". A
// moderation queue also reads better with the exact date than a relative one.
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: "UTC",
});

/** "1 Jul 2026, 3:22 PM" (UTC) */
function formatReviewDate(iso: string): string {
  const date = new Date(iso);
  return `${dateFormatter.format(date)}, ${timeFormatter.format(date)}`;
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

const STATUS_BADGE: Record<ReviewStatus, { variant: "success" | "warning" | "destructive"; label: string }> = {
  pending: { variant: "warning", label: "Pending" },
  approved: { variant: "success", label: "Approved" },
  rejected: { variant: "destructive", label: "Rejected" },
};

/** Admin moderation table: one row per review with its status and a moderation control. */
export function ReviewsTable({ reviews, productsById }: ReviewsTableProps) {
  return (
    <div className="overflow-x-auto rounded-card-lg border border-border">
      <table className="w-full min-w-[48rem] border-collapse text-left">
        <thead className="border-b border-border bg-surface-sunken text-body-b9 uppercase tracking-wide text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Author</th>
            <th scope="col" className="px-4 py-3 font-medium">Product</th>
            <th scope="col" className="px-4 py-3 font-medium">Rating</th>
            <th scope="col" className="px-4 py-3 font-medium">Review</th>
            <th scope="col" className="px-4 py-3 font-medium">Status</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {reviews.map((review) => {
            const badge = STATUS_BADGE[review.status];
            const product = productsById.get(review.productId);
            return (
              <tr key={review.id} className="bg-background align-top transition-colors hover:bg-surface-sunken/40">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    {review.authorAvatarUrl ? (
                      <Image
                        src={review.authorAvatarUrl}
                        alt=""
                        width={36}
                        height={36}
                        className="size-9 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-body-b9 text-accent-foreground"
                      >
                        {getInitials(review.authorName)}
                      </span>
                    )}
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-body-b7 text-foreground">{review.authorName}</span>
                      <time
                        dateTime={review.createdAt}
                        className="text-body-b10 text-muted-foreground"
                      >
                        {formatReviewDate(review.createdAt)}
                      </time>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  {product ? (
                    <Link
                      href={`/dashboard/products/${product.id}/edit`}
                      className="group flex items-center gap-3"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-card-md bg-surface-sunken">
                        <Image
                          src={product.imageUrl}
                          alt=""
                          width={36}
                          height={36}
                          className="size-full object-cover"
                        />
                      </span>
                      <span className="line-clamp-2 max-w-[12rem] text-body-b7 text-foreground underline-offset-2 group-hover:underline">
                        {product.name}
                      </span>
                    </Link>
                  ) : (
                    <span className="text-body-b8 text-muted-foreground">Unknown product</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-sunken px-2 py-0.5">
                    <Icon icon={Star} size="xs" className="fill-rating text-rating" />
                    <span className="text-body-b8 text-foreground">{review.rating.toFixed(1)}</span>
                  </span>
                </td>
                <td className="px-4 py-4">
                  {review.comment ? (
                    <p className="line-clamp-3 max-w-sm text-body-b6 text-muted-foreground">
                      {review.comment}
                    </p>
                  ) : (
                    <span className="text-body-b8 italic text-muted-foreground/70">No comment</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </td>
                <td className="px-4 py-4">
                  <ReviewStatusSelect id={review.id} status={review.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
