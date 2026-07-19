import { getLocale, getTranslations } from "next-intl/server";
import { Pencil } from "lucide-react";
import {
  DEFAULT_ADMIN_PROMO_CODE_DIRECTION,
  DEFAULT_ADMIN_PROMO_CODE_SORT,
  getPromoCodeStatus,
  type AdminPromoCode,
  type PromoCodeStatus,
} from "@/src/domain/entities/PromoCode";
import type { Locale } from "@/src/i18n/routing";
import { formatNumber } from "@/src/lib/formatNumber";
import {
  Badge,
  Button,
  DataTable,
  Icon,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/presentation/design-system";
import { ListSortHeader } from "@/src/presentation/dashboard/list";
import { Link } from "@/src/i18n/navigation";
import { PromoCodeActiveToggle } from "./PromoCodeActiveToggle";
import { promoValidityLabel } from "./promoValidity";

type PromoCodesTableProps = {
  promoCodes: AdminPromoCode[];
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
export async function PromoCodesTable({ promoCodes }: PromoCodesTableProps) {
  const t = await getTranslations("dashPromoCodes");
  const locale = (await getLocale()) as Locale;
  const now = new Date();

  const sortDefaults = {
    defaultSort: DEFAULT_ADMIN_PROMO_CODE_SORT,
    defaultDirection: DEFAULT_ADMIN_PROMO_CODE_DIRECTION,
  } as const;

  return (
    <DataTable>
      <Table>
        <TableHeader>
          <tr>
            <ListSortHeader sortKey="code" {...sortDefaults}>
              {t("colCode")}
            </ListSortHeader>
            <ListSortHeader sortKey="discount" initialDirection="desc" align="end" {...sortDefaults}>
              {t("colDiscount")}
            </ListSortHeader>
            <ListSortHeader sortKey="endsAt" {...sortDefaults}>
              {t("colValidity")}
            </ListSortHeader>
            <ListSortHeader sortKey="usage" initialDirection="desc" align="end" {...sortDefaults}>
              {t("colUsage")}
            </ListSortHeader>
            <TableHead>{t("colStatus")}</TableHead>
            <TableHead className="text-end">{t("colActions")}</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {promoCodes.map((promo) => {
            const status = getPromoCodeStatus(promo, now);
            const validity = promoValidityLabel(promo, locale);

            return (
              <TableRow key={promo.id}>
                <TableCell>
                  {/* The code is the identifier operators trade in, so it leads and
                      stays LTR — the codes are Latin even on the Persian store. */}
                  <span className="block text-body-b7 text-foreground" dir="ltr">
                    {promo.code}
                  </span>
                  <span className="block text-body-b10 text-muted-foreground">{promo.title}</span>
                </TableCell>
                <TableCell className="text-end text-body-b7 text-foreground">
                  {t("discountValue", { percent: formatNumber(promo.discountPercent, locale) })}
                </TableCell>
                <TableCell className="text-body-b6 text-muted-foreground">
                  {t(validity.key, validity.values)}
                </TableCell>
                <TableCell className="text-end text-body-b6 text-muted-foreground">
                  {t("usageValue", { count: promo.usageCount })}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[status]}>{t(STATUS_LABEL_KEYS[status])}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/promo-codes/${promo.id}/edit`}>
                        <Icon icon={Pencil} size="sm" className="me-1.5" />
                        {t("edit")}
                      </Link>
                    </Button>
                    <PromoCodeActiveToggle id={promo.id} code={promo.code} active={promo.active} />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </DataTable>
  );
}
