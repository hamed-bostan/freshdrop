import { Star } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import type { Product } from "@/src/domain/entities/Product";
import type { PublicReview, ReviewStatus } from "@/src/domain/entities/Review";
import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { formatNumber } from "@/src/lib/formatNumber";
import { formatCompactDateTime } from "@/src/lib/formatOrderDate";
import { BulkRowCheckbox, BulkSelectAllCheckbox } from "@/src/presentation/dashboard/bulk";
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

import { ReviewModerationActions } from "./ReviewModerationActions";

import type { ReactNode } from "react";

type ReviewsTableProps = {
  reviews: PublicReview[];
  /** Product id → product, for the Product column's name + thumbnail. */
  productsById: Map<string, Product>;
  /**
   * Whether the viewer may decide reviews. Drops the per-row control *and* the
   * selection checkboxes — there's nothing to select for without the bulk actions.
   */
  canModerate: boolean;
  /** Pagination attached to the table frame, matching the other dashboard lists. */
  footer?: ReactNode;
};

/** "1 Jul 2026, 3:22 PM" (en, UTC) — Jalali + Persian numerals under `fa`. */
function formatReviewDate(iso: string, locale: Locale): string {
  const { date, time } = formatCompactDateTime(iso, locale);
  return `${date}, ${time}`;
}

const STATUS_BADGE: Record<ReviewStatus, { variant: "success" | "warning" | "destructive"; labelKey: "statusPending" | "statusApproved" | "statusRejected" }> = {
  pending: { variant: "warning", labelKey: "statusPending" },
  approved: { variant: "success", labelKey: "statusApproved" },
  rejected: { variant: "destructive", labelKey: "statusRejected" },
};

/** Admin moderation table: one row per review with its status and a moderation control. */
export function ReviewsTable({ reviews, productsById, canModerate, footer }: ReviewsTableProps) {
  const t = useTranslations("dashReviews");
  const locale = useLocale();

  return (
    <DataTable minWidthClassName="min-w-[56rem]" footer={footer}>
      <Table className="table-fixed border-collapse">
        <TableHeader>
          <tr>
            {canModerate ? (
              <TableHead className="w-10">
                <BulkSelectAllCheckbox label={t("selectAllAria")} />
              </TableHead>
            ) : null}
            <TableHead className="w-[22%]">{t("colAuthor")}</TableHead>
            <TableHead className="w-[32%]">{t("colReview")}</TableHead>
            <TableHead className="w-[22%]">{t("colProduct")}</TableHead>
            <TableHead className="w-[10%]">{t("colStatus")}</TableHead>
            {canModerate ? <TableHead className="w-[14%] text-end">{t("colAction")}</TableHead> : null}
          </tr>
        </TableHeader>
        <TableBody>
          {reviews.map((review) => {
            const badge = STATUS_BADGE[review.status];
            const product = productsById.get(review.productId);
            return (
              <TableRow key={review.id}>
                {canModerate ? (
                  <TableCell className="py-4">
                    <BulkRowCheckbox id={review.id} label={t("selectRowAria", { name: review.authorName })} />
                  </TableCell>
                ) : null}
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
                      <span className="line-clamp-2 text-body-b7 text-foreground">{review.authorName}</span>
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
                  <div className="flex items-start gap-3">
                    <span
                      className="inline-flex w-fit shrink-0 items-center gap-1 rounded-full bg-surface-sunken px-2 py-0.5"
                      aria-label={t("ratingAria", { rating: formatNumber(review.rating, locale, 1) })}
                    >
                      <Icon icon={Star} size="xs" className="fill-rating text-rating" />
                      <span className="text-body-b8 text-foreground">{formatNumber(review.rating, locale, 1)}</span>
                    </span>
                    {review.comment ? (
                      <p className="line-clamp-3 min-w-0 text-body-b6 text-foreground">
                        {review.comment}
                      </p>
                    ) : (
                      <span className="text-body-b8 italic text-muted-foreground/70">{t("noComment")}</span>
                    )}
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
                  <Badge variant={badge.variant}>{t(badge.labelKey)}</Badge>
                </TableCell>
                {canModerate ? (
                  <TableCell className="py-4">
                    <ReviewModerationActions
                      id={review.id}
                      status={review.status}
                      authorName={review.authorName}
                    />
                  </TableCell>
                ) : null}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </DataTable>
  );
}
