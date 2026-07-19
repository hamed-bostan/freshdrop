"use client";

import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { pageCount, type Page } from "@/src/domain/entities/Pagination";
import { Button, Icon } from "@/src/presentation/design-system";
import { mergePageParams } from "@/src/lib/api/pagination-params";
import { formatNumber } from "@/src/lib/formatNumber";
import { useListParams } from "./useListParams";

type ListPagerProps = {
  /** The page currently rendered — supplies the counts, so they can't disagree with the rows. */
  page: Pick<Page<unknown>, "total" | "page" | "pageSize">;
};

/**
 * Page controls for an admin list: which rows are on screen, out of how many, and
 * the way to the next slice.
 *
 * Renders nothing when everything fits on one page — a pager reading "1–8 of 8"
 * with both arrows disabled is noise on a list that isn't paged in practice.
 *
 * Previous/next only, no numbered pages: the tables are sorted and filtered to
 * find rows, not browsed by ordinal, and jumping to "page 34" of a list you can
 * search is rarely what anyone wants. A jump-to-page control can be added here if
 * that turns out to be wrong.
 */
export function ListPager({ page }: ListPagerProps) {
  const { searchParams, setParams } = useListParams();
  const t = useTranslations("dashList");
  const locale = useLocale();

  const totalPages = pageCount(page.total, page.pageSize);
  if (totalPages <= 1) return null;

  const first = (page.page - 1) * page.pageSize + 1;
  const last = Math.min(page.total, page.page * page.pageSize);

  function goTo(next: number): void {
    setParams(mergePageParams(searchParams, { page: next }));
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-body-b8 text-muted-foreground">
        {t("range", {
          first: formatNumber(first, locale),
          last: formatNumber(last, locale),
          total: formatNumber(page.total, locale),
        })}
      </p>

      <div className="flex items-center gap-2">
        <p className="text-body-b8 text-muted-foreground">
          {t("pageOf", {
            page: formatNumber(page.page, locale),
            pages: formatNumber(totalPages, locale),
          })}
        </p>
        {/* The chevrons point at previous/next in reading order, so they mirror
            under RTL — `ms/me` logic isn't enough for a glyph that has a
            direction of its own. */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => goTo(page.page - 1)}
          disabled={page.page <= 1}
          aria-label={t("previous")}
        >
          <Icon icon={ChevronLeft} size="sm" className="rtl:rotate-180" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goTo(page.page + 1)}
          disabled={page.page >= totalPages}
          aria-label={t("next")}
        >
          <Icon icon={ChevronRight} size="sm" className="rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
