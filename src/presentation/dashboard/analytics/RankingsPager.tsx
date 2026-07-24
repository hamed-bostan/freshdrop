"use client";

import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { pageCount, type Page } from "@/src/domain/entities/Pagination";
import { Button, Icon } from "@/src/presentation/design-system";
import { formatNumber } from "@/src/lib/formatNumber";
import { useListParams } from "@/src/presentation/dashboard/list";

type RankingsPagerProps = {
  /** The page currently rendered — supplies the counts, so they can't disagree with the rows. */
  page: Pick<Page<unknown>, "total" | "page" | "pageSize">;
  /** The query param this table's page number lives under — distinct per ranking, so two tables on one screen don't collide. */
  paramName: string;
};

/**
 * `ListPager`'s counterpart for a ranking table, which can't reuse it directly:
 * `ListPager` writes the shared `page` param every admin *list* uses, and the
 * analytics page holds two ranking tables — products and categories — side by
 * side, each needing its own page number in the same query string.
 *
 * Otherwise identical: previous/next only, renders nothing on a single page, and
 * every other param on the URL (the date range, both sort selects, the other
 * table's page) survives untouched.
 */
export function RankingsPager({ page, paramName }: RankingsPagerProps) {
  const { searchParams, setParams } = useListParams();
  const t = useTranslations("dashList");
  const locale = useLocale();

  const totalPages = pageCount(page.total, page.pageSize);
  if (totalPages <= 1) return null;

  const first = (page.page - 1) * page.pageSize + 1;
  const last = Math.min(page.total, page.page * page.pageSize);

  function goTo(next: number): void {
    const params = new URLSearchParams(searchParams);
    if (next > 1) params.set(paramName, String(next));
    else params.delete(paramName);
    setParams(params);
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
