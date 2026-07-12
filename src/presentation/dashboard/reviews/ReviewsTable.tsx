import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Star } from "lucide-react";
import type { Locale } from "@/src/i18n/routing";
import type { Review, ReviewStatus } from "@/src/domain/entities/Review";
import type { Product } from "@/src/domain/entities/Product";
import { Badge, Icon } from "@/src/presentation/design-system";
import { Link } from "@/src/i18n/navigation";
import { ReviewStatusSelect } from "./ReviewStatusSelect";

type ReviewsTableProps = {
  reviews: Review[];
  /** Product id → product, for the Product column's name + thumbnail. */
  productsById: Map<string, Product>;
};

// Fixed UTC formatters → deterministic output (identical on server and client), so
// the server-rendered submission date doesn't trigger a hydration mismatch — unlike
// relative time ("5 seconds ago"), which is computed against a moving "now". A
// moderation queue also reads better with the exact date than a relative one. Under
// `fa` the date is Jalali with Persian numerals (`fa-IR-u-ca-persian`). Built once
// per locale, then reused.
const DATE_TAG: Record<Locale, string> = { en: "en-GB", fa: "fa-IR-u-ca-persian" };
const TIME_TAG: Record<Locale, string> = { en: "en-US", fa: "fa-IR-u-ca-persian" };

const cache = new Map<Locale, { date: Intl.DateTimeFormat; time: Intl.DateTimeFormat }>();

function getFormatters(locale: Locale): { date: Intl.DateTimeFormat; time: Intl.DateTimeFormat } {
  const cached = cache.get(locale);
  if (cached) return cached;

  const formatters = {
    date: new Intl.DateTimeFormat(DATE_TAG[locale], {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }),
    time: new Intl.DateTimeFormat(TIME_TAG[locale], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    }),
  };
  cache.set(locale, formatters);
  return formatters;
}

/** "1 Jul 2026, 3:22 PM" (en, UTC) — Jalali + Persian numerals under `fa`. */
function formatReviewDate(iso: string, locale: Locale): string {
  const date = new Date(iso);
  const f = getFormatters(locale);
  return `${f.date.format(date)}, ${f.time.format(date)}`;
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

const STATUS_BADGE: Record<ReviewStatus, { variant: "success" | "warning" | "destructive"; labelKey: "statusPending" | "statusApproved" | "statusRejected" }> = {
  pending: { variant: "warning", labelKey: "statusPending" },
  approved: { variant: "success", labelKey: "statusApproved" },
  rejected: { variant: "destructive", labelKey: "statusRejected" },
};

/** Admin moderation table: one row per review with its status and a moderation control. */
export function ReviewsTable({ reviews, productsById }: ReviewsTableProps) {
  const t = useTranslations("dashReviews");
  const locale = useLocale();

  return (
    <div className="overflow-x-auto rounded-card-lg border border-border">
      <table className="w-full min-w-[48rem] border-collapse text-start">
        <thead className="border-b border-border bg-surface-sunken text-body-b9 uppercase tracking-wide text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">{t("colAuthor")}</th>
            <th scope="col" className="px-4 py-3 font-medium">{t("colProduct")}</th>
            <th scope="col" className="px-4 py-3 font-medium">{t("colRating")}</th>
            <th scope="col" className="px-4 py-3 font-medium">{t("colReview")}</th>
            <th scope="col" className="px-4 py-3 font-medium">{t("colStatus")}</th>
            <th scope="col" className="px-4 py-3 text-end font-medium">{t("colAction")}</th>
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
                        {formatReviewDate(review.createdAt, locale)}
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
                    <span className="text-body-b8 text-muted-foreground">{t("unknownProduct")}</span>
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
                    <span className="text-body-b8 italic text-muted-foreground/70">{t("noComment")}</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <Badge variant={badge.variant}>{t(badge.labelKey)}</Badge>
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
