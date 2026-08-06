import Image from "next/image";
import type { ReactNode } from "react";
import { getLocale } from "next-intl/server";
import type { Page } from "@/src/domain/entities/Pagination";
import type { Locale } from "@/src/i18n/routing";
import { Link } from "@/src/i18n/navigation";
import {
  DataTable,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Thumbnail,
} from "@/src/presentation/design-system";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { RankingsPager } from "./RankingsPager";

/** One ranked row — a product's own top-N ranking, flattened for the table. */
export type RevenueRankRow = {
  id: string;
  label: string;
  imageUrl?: string;
  units: number;
  revenue: number;
  /** Where the row leads — the filtered list behind it. Omitted when there's nowhere to go. */
  href?: string;
};

type RankingsTableProps = {
  heading: string;
  /** A page of the ranked rows — sliced from the enlarged `rankLimit` fetch. */
  page: Page<RevenueRankRow>;
  /** The query param this table's own page number lives under (see `RankingsPager`). */
  pageParamName: string;
  emptyLabel: string;
  colRankLabel: string;
  colNameLabel: string;
  colUnitsLabel: string;
  colRevenueLabel: string;
  /** A control rendered beside the heading — typically the sort select that orders `page`. */
  headingAction?: ReactNode;
};

/**
 * The analytics page's full revenue/units ranking — as many rows as `rankLimit`
 * fetched, with its own pager, rather than a bar-backed top-N list.
 */
export async function RankingsTable({
  heading,
  page,
  pageParamName,
  emptyLabel,
  colRankLabel,
  colNameLabel,
  colUnitsLabel,
  colRevenueLabel,
  headingAction,
}: RankingsTableProps) {
  const locale = (await getLocale()) as Locale;

  return (
    <section className="flex flex-col gap-3 rounded-card-lg border border-border p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-body-b5 text-foreground">{heading}</h2>
        {headingAction}
      </div>

      {page.items.length > 0 ? (
        <>
          <DataTable>
            <Table>
              <TableHeader>
                <tr>
                  <TableHead className="w-12">{colRankLabel}</TableHead>
                  <TableHead>{colNameLabel}</TableHead>
                  <TableHead className="text-end">{colUnitsLabel}</TableHead>
                  <TableHead className="text-end">{colRevenueLabel}</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {page.items.map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-body-b8 text-muted-foreground">
                      {formatNumber((page.page - 1) * page.pageSize + index + 1, locale)}
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-3">
                        {row.imageUrl ? (
                          <Thumbnail className="size-8 shrink-0">
                            <Image
                              src={row.imageUrl}
                              alt=""
                              width={32}
                              height={32}
                              className="size-full object-contain"
                            />
                          </Thumbnail>
                        ) : null}
                        {row.href ? (
                          <Link
                            href={row.href}
                            className="truncate text-body-b7 text-foreground hover:underline"
                          >
                            {row.label}
                          </Link>
                        ) : (
                          <span className="truncate text-body-b7 text-foreground">{row.label}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-end text-body-b7 text-muted-foreground">
                      {formatNumber(row.units, locale)}
                    </TableCell>
                    <TableCell className="text-end text-body-b7 text-foreground">
                      {formatMoney(row.revenue, locale)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTable>
          <RankingsPager page={page} paramName={pageParamName} />
        </>
      ) : (
        <p className="py-6 text-center text-body-b7 text-muted-foreground">{emptyLabel}</p>
      )}
    </section>
  );
}
