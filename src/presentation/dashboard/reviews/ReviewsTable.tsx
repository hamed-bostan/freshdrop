import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Star } from "lucide-react";
import type { Locale } from "@/src/i18n/routing";
import type { Review, ReviewStatus } from "@/src/domain/entities/Review";
import type { Product } from "@/src/domain/entities/Product";
import { formatNumber } from "@/src/lib/formatNumber";
import {
  Avatar,
  Badge,
  DataTable,
  Icon,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Thumbnail,
} from "@/src/presentation/design-system";
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
      hour12: locale === "en",
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
    <DataTable minWidthClassName="min-w-[48rem]">
      <Table className="border-collapse">
        <TableHeader>
          <tr>
            <TableHead>{t("colAuthor")}</TableHead>
            <TableHead>{t("colProduct")}</TableHead>
            <TableHead>{t("colRating")}</TableHead>
            <TableHead>{t("colReview")}</TableHead>
            <TableHead>{t("colStatus")}</TableHead>
            <TableHead className="text-end">{t("colAction")}</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {reviews.map((review) => {
            const badge = STATUS_BADGE[review.status];
            const product = productsById.get(review.productId);
            return (
              <TableRow key={review.id} className="align-top">
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={review.authorName} className="size-9">
                      {review.authorAvatarUrl && (
                        <Image
                          src={review.authorAvatarUrl}
                          alt=""
                          width={36}
                          height={36}
                          className="size-full object-cover"
                        />
                      )}
                    </Avatar>
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
                </TableCell>
                <TableCell className="py-4">
                  {product ? (
                    <Link
                      href={`/dashboard/products/${product.id}/edit`}
                      className="group flex items-center gap-3"
                    >
                      <Thumbnail as="span" className="size-9">
                        <Image
                          src={product.imageUrl}
                          alt=""
                          width={36}
                          height={36}
                          className="size-full object-cover"
                        />
                      </Thumbnail>
                      <span className="line-clamp-2 max-w-[12rem] text-body-b7 text-foreground underline-offset-2 group-hover:underline">
                        {product.name}
                      </span>
                    </Link>
                  ) : (
                    <span className="text-body-b8 text-muted-foreground">{t("unknownProduct")}</span>
                  )}
                </TableCell>
                <TableCell className="py-4">
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-sunken px-2 py-0.5">
                    <Icon icon={Star} size="xs" className="fill-rating text-rating" />
                    <span className="text-body-b8 text-foreground">{formatNumber(review.rating, locale, 1)}</span>
                  </span>
                </TableCell>
                <TableCell className="py-4">
                  {review.comment ? (
                    <p className="line-clamp-3 max-w-sm text-body-b6 text-muted-foreground">
                      {review.comment}
                    </p>
                  ) : (
                    <span className="text-body-b8 italic text-muted-foreground/70">{t("noComment")}</span>
                  )}
                </TableCell>
                <TableCell className="py-4">
                  <Badge variant={badge.variant}>{t(badge.labelKey)}</Badge>
                </TableCell>
                <TableCell className="py-4">
                  <ReviewStatusSelect id={review.id} status={review.status} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </DataTable>
  );
}
