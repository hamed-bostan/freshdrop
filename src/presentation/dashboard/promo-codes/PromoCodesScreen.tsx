import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import {
  PROMO_CODE_STATUSES,
  type AdminPromoCodeFilters,
  type PromoCodeStatus,
} from "@/src/domain/entities/PromoCode";
import type { Page } from "@/src/domain/entities/Pagination";
import type { AdminPromoCode } from "@/src/domain/entities/PromoCode";
import { Button, Icon } from "@/src/presentation/design-system";
import { ListFilterSelect, ListPager, ListSearchInput, ListToolbar } from "@/src/presentation/dashboard/list";
import { Link } from "@/src/i18n/navigation";
import { PromoCodesTable } from "./PromoCodesTable";

type PromoCodesScreenProps = {
  /** One page of campaigns plus the total behind it — the count in the header is that total. */
  promoCodes: Page<AdminPromoCode>;
  /** The filters this page was fetched with, to distinguish "no campaigns" from "no matches". */
  filters: AdminPromoCodeFilters;
};

/**
 * Admin promo-code list. Presentational: the dashboard page fetches one page over
 * the REST API (BFF) during server render and passes it in. Search, filter and
 * paging live in the URL, so changing any of them re-runs this server render — and
 * mutations call `router.refresh()` (see PromoCodeActiveToggle). Either way the
 * server stays the single source of truth; there's no client-side copy of the list.
 */
export async function PromoCodesScreen({ promoCodes, filters }: PromoCodesScreenProps) {
  const t = await getTranslations("dashPromoCodes");
  const tList = await getTranslations("dashList");

  // An empty page means two different things, and they need different copy: no
  // campaigns at all wants "create your first"; a filter that matched nothing wants
  // a way back to the full list.
  const isFiltered = filters.query != null || filters.status != null;

  const statusLabels: Record<PromoCodeStatus, string> = {
    active: t("statusActive"),
    scheduled: t("statusScheduled"),
    expired: t("statusExpired"),
    inactive: t("statusInactive"),
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-heading-h2 text-foreground">{t("heading")}</h1>
          <p className="text-body-b6 text-muted-foreground">{t("count", { count: promoCodes.total })}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/promo-codes/create">
            <Icon icon={Plus} size="sm" className="me-1.5" />
            {t("newPromoCode")}
          </Link>
        </Button>
      </div>

      <ListToolbar
        search={<ListSearchInput label={t("searchLabel")} placeholder={t("searchPlaceholder")} />}
        filters={
          <ListFilterSelect
            paramName="status"
            label={t("filterStatusLabel")}
            options={[
              { value: "", label: t("filterStatusAll") },
              ...PROMO_CODE_STATUSES.map((status) => ({ value: status, label: statusLabels[status] })),
            ]}
          />
        }
      />

      {promoCodes.items.length > 0 ? (
        <>
          <PromoCodesTable promoCodes={promoCodes.items} />
          <ListPager page={promoCodes} />
        </>
      ) : (
        <div className="rounded-card-lg border border-dashed border-border px-6 py-16 text-center">
          <p className="text-body-b4 text-foreground">
            {isFiltered ? tList("noResultsTitle") : t("emptyTitle")}
          </p>
          <p className="mt-1 text-body-b6 text-muted-foreground">
            {isFiltered ? tList("noResultsBody") : t("emptyBody")}
          </p>
        </div>
      )}
    </div>
  );
}
