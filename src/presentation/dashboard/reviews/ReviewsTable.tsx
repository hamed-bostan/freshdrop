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
  /** Search controls attached to the table's upper edge. */
  toolbar?: ReactNode;
  /** Selection actions attached inside the same table frame. */
  bulkActions?: ReactNode;
  /** Content shown inside the shared frame when the active queue has no rows. */
  emptyState?: ReactNode;
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
export function ReviewsTable({ reviews, productsById, canModerate, toolbar, bulkActions, emptyState, footer }: ReviewsTableProps) {
  const t = useTranslations("dashReviews");
  const locale = useLocale();

  return (
    <DataTable className="min-w-0" toolbar={toolbar} footer={reviews.length > 0 ? footer : undefined}>
      {bulkActions ? (
        <div className="[&:has(>div)]:border-b [&:has(>div)]:border-border [&:has(>div)]:p-4">
          {bulkActions}
        </div>
      ) : null}
      {reviews.length > 0 ? <>
    <div className="space-y-3 p-3 @min-[64rem]:hidden">
      {canModerate ? (
        <label className="flex min-h-11 w-fit items-center gap-3 text-body-b7 text-muted-foreground">
          <BulkSelectAllCheckbox label={t("selectAllAria")} />
          {t("selectAllAria")}
        </label>
      ) : null}
      {reviews.map((review) => {
        const badge = STATUS_BADGE[review.status];
        const product = productsById.get(review.productId);
        return (
          <article key={review.id} className="min-w-0 rounded-card-lg border border-border bg-background p-4 sm:p-5">
            <div className="flex items-start gap-3">
              {canModerate ? (
                <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center">
                  <BulkRowCheckbox id={review.id} label={t("selectRowAria", { name: review.authorName })} />
                </label>
              ) : null}
              <Avatar name={review.authorName} className="size-9 shrink-0">
                {review.authorAvatarUrl ? <Image src={review.authorAvatarUrl} alt="" width={36} height={36} className="size-full object-cover" /> : null}
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="break-words text-body-b7 text-foreground">{review.authorName}</p>
                <time dateTime={review.createdAt} className="text-body-b10 text-muted-foreground">{formatReviewDate(review.createdAt, locale)}</time>
              </div>
            </div>
            <div className="my-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2.5 py-1" aria-label={t("ratingAria", { rating: formatNumber(review.rating, locale, 1) })}>
                <Icon icon={Star} size="xs" className="fill-rating text-rating" />
                <span className="text-body-b8 text-foreground">{formatNumber(review.rating, locale, 1)}</span>
              </span>
              <Badge variant={badge.variant}>{t(badge.labelKey)}</Badge>
            </div>
            <p className="whitespace-pre-wrap break-words text-body-b6 leading-relaxed text-foreground [overflow-wrap:anywhere]">{review.comment || t("noComment")}</p>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
              {product ? (
                <Link href={`/dashboard/products/${product.id}/edit`} className="flex min-w-0 max-w-full items-center gap-2.5 rounded-card-md hover:underline focus-visible:outline-2 focus-visible:outline-primary">
                  <Thumbnail as="span" className="size-9 shrink-0"><Image src={product.imageUrl} alt="" width={36} height={36} className="size-full object-cover" /></Thumbnail>
                  <span className="min-w-0 break-words text-body-b7 text-foreground">{product.name}</span>
                </Link>
              ) : <span className="text-body-b8 text-muted-foreground">{t("unknownProduct")}</span>}
              {canModerate ? <div className="ms-auto"><ReviewModerationActions id={review.id} status={review.status} authorName={review.authorName} /></div> : null}
            </div>
          </article>
        );
      })}
    </div>
    <div className="hidden overflow-x-auto @min-[64rem]:block">
      <div className="min-w-[64rem]">
      <Table className="table-fixed border-collapse">
        <TableHeader>
          <tr>
            {canModerate ? (
              <TableHead className="w-10">
                <label className="flex size-8 cursor-pointer items-center justify-center">
                  <BulkSelectAllCheckbox label={t("selectAllAria")} />
                </label>
              </TableHead>
            ) : null}
            <TableHead className="w-[22%]">{t("colAuthor")}</TableHead>
            <TableHead className="w-[28%]">{t("colReview")}</TableHead>
            <TableHead className="w-[20%]">{t("colProduct")}</TableHead>
            <TableHead className="w-[12%]">{t("colStatus")}</TableHead>
            {canModerate ? <TableHead className="w-[18%] text-end">{t("colAction")}</TableHead> : null}
          </tr>
        </TableHeader>
        <TableBody>
          {reviews.map((review) => {
            const badge = STATUS_BADGE[review.status];
            const product = productsById.get(review.productId);
            return (
              <TableRow key={review.id} className="align-top">
                {canModerate ? (
                  <TableCell className="py-4">
                    <label className="flex size-8 cursor-pointer items-center justify-center">
                      <BulkRowCheckbox id={review.id} label={t("selectRowAria", { name: review.authorName })} />
                    </label>
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
                      <p className="min-w-0 whitespace-pre-wrap break-words text-body-b6 leading-relaxed text-foreground [overflow-wrap:anywhere]">
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
      </div>
    </div>
      </> : emptyState}
    </DataTable>
  );
}
