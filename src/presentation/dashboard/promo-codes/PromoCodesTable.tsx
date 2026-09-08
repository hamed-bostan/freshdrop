import { getLocale, getTranslations } from "next-intl/server";

import {
  DEFAULT_ADMIN_PROMO_CODE_DIRECTION,
  DEFAULT_ADMIN_PROMO_CODE_SORT,
  getPromoCodeStatus,
  type AdminPromoCode,
  type PromoCodeStatus,
} from "@/src/domain/entities/PromoCode";
import { Link } from "@/src/i18n/navigation";
import { formatNumber } from "@/src/lib/formatNumber";
import { ListSortHeader } from "@/src/presentation/dashboard/list";
import {
  Badge,
  DataTable,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/presentation/design-system";

import { PromoCodeRowActions } from "./PromoCodeRowActions";
import { promoValidityLabel } from "./promoValidity";

import type { ReactNode } from "react";

type PromoCodesTableProps = {
  promoCodes: AdminPromoCode[];
  toolbar?: ReactNode;
  emptyState?: ReactNode;
  footer?: ReactNode;
};

/** Badge tone per campaign state — live is the only affirmative one. */
const STATUS_VARIANTS: Record<PromoCodeStatus, "success" | "neutral" | "info" | "warning"> = {
  active: "success",
  inactive: "neutral",
  scheduled: "info",
  expired: "warning",
};

const STATUS_LABEL_KEYS = {
  active: "statusActive",
  inactive: "statusInactive",
  scheduled: "statusScheduled",
  expired: "statusExpired",
} as const satisfies Record<PromoCodeStatus, string>;

/**
 * Admin list of discount campaigns: what each one gives, when it runs, how much
 * it's been used, and whether it's live right now.
 *
 * The status is derived per render from the same rule the repository filters on
 * (`getPromoCodeStatus`), so a campaign that expires while nobody is looking reads
 * as expired the next time the page is opened — there's no stored status column to
 * fall out of date.
 */
export async function PromoCodesTable({ promoCodes, toolbar, emptyState, footer }: PromoCodesTableProps) {
  const t = await getTranslations("dashPromoCodes");
  const locale = (await getLocale());
  const now = new Date();

  const sortDefaults = {
    defaultSort: DEFAULT_ADMIN_PROMO_CODE_SORT,
    defaultDirection: DEFAULT_ADMIN_PROMO_CODE_DIRECTION,
  } as const;

  return (
    <DataTable
      className="min-w-0 bg-background"
      toolbar={toolbar}
      footer={promoCodes.length > 0 ? footer : undefined}
    >
      {promoCodes.length > 0 ? (
      <Table className="table-fixed xl:table-auto">
        <TableHeader>
          <tr>
            <ListSortHeader sortKey="code" className="px-4 py-3 text-start" {...sortDefaults}>
              {t("colCode")}
            </ListSortHeader>
            <ListSortHeader sortKey="discount" initialDirection="desc" align="end" className="w-28 px-4 py-3 sm:w-36" {...sortDefaults}>
              {t("colDiscount")}
            </ListSortHeader>
            <ListSortHeader sortKey="endsAt" className="hidden xl:table-cell" {...sortDefaults}>
              {t("colValidity")}
            </ListSortHeader>
            <ListSortHeader sortKey="usage" initialDirection="desc" align="end" className="hidden xl:table-cell" {...sortDefaults}>
              {t("colUsage")}
            </ListSortHeader>
            <TableHead className="hidden xl:table-cell">{t("colStatus")}</TableHead>
            <TableHead className="w-12 px-2 text-end sm:w-16"><span className="sr-only">{t("colActions")}</span></TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {promoCodes.map((promo) => {
            const status = getPromoCodeStatus(promo, now);
            const validity = promoValidityLabel(promo, locale);

            return (
              <TableRow key={promo.id} className="h-24 xl:h-20">
                <TableCell className="px-4 py-4 align-middle">
                  {/* The code is the identifier operators trade in, so it leads and
                      stays LTR — the codes are Latin even on the Persian store. */}
                  <Link href={`/dashboard/promo-codes/${promo.id}/edit`} className="group block min-w-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="break-all font-mono text-sm font-semibold tracking-wide text-foreground transition-colors group-hover:text-primary" dir="ltr">
                      {promo.code}
                    </span>
                    <span className="mt-1 block break-words text-body-b6 text-muted-foreground">{promo.title}</span>
                  </Link>
                  <p className="mt-2 text-body-b10 text-muted-foreground xl:hidden">{t(validity.key, validity.values)} · {t("usageValue", { count: promo.usageCount })}</p>
                </TableCell>
                <TableCell className="px-4 py-4 text-end align-middle text-body-b7 tabular-nums text-foreground">
                  <span className="block">{t("discountValue", { percent: formatNumber(promo.discountPercent, locale) })}</span>
                  <Badge variant={STATUS_VARIANTS[status]} className="mt-2 xl:hidden">{t(STATUS_LABEL_KEYS[status])}</Badge>
                </TableCell>
                <TableCell className="hidden px-5 py-4 text-body-b6 text-muted-foreground xl:table-cell">
                  {t(validity.key, validity.values)}
                </TableCell>
                <TableCell className="hidden px-5 py-4 text-end text-body-b6 text-muted-foreground xl:table-cell">
                  {t("usageValue", { count: promo.usageCount })}
                </TableCell>
                <TableCell className="hidden px-5 py-4 xl:table-cell">
                  <Badge variant={STATUS_VARIANTS[status]}>{t(STATUS_LABEL_KEYS[status])}</Badge>
                </TableCell>
                <TableCell className="px-2 py-4 text-end align-middle">
                  <PromoCodeRowActions id={promo.id} code={promo.code} active={promo.active} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      ) : (
        emptyState
      )}
    </DataTable>
  );
}
