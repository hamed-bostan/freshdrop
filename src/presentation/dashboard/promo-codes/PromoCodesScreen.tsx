import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { Page } from "@/src/domain/entities/Pagination";
import {
  PROMO_CODE_STATUSES,
  type AdminPromoCodeFilters,
  type PromoCodeStatus,
  type AdminPromoCode,
} from "@/src/domain/entities/PromoCode";
import { Link } from "@/src/i18n/navigation";
import { ListFilterReset, ListFilterSelect, ListPager, ListSearchInput } from "@/src/presentation/dashboard/list";
import { Button, Icon } from "@/src/presentation/design-system";

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
  const tDashboard = await getTranslations("dashboard");

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
    <div className="mx-auto flex w-full max-w-[37.5rem] flex-col gap-6 dashboard-phone:gap-4 dashboard-short:max-w-none dashboard-short:gap-5 dashboard-landscape:max-w-none xl:max-w-none">
      <div className="flex items-end justify-between gap-3 sm:mb-3.5 sm:items-center dashboard-short:mb-0 dashboard-landscape:mb-0 xl:mb-0">
        <div>
          <p className="mb-2 hidden text-label-l1 uppercase tracking-[0.12em] text-muted-foreground sm:block dashboard-short:hidden dashboard-landscape:hidden xl:hidden">
            {tDashboard("groupMarketing")}
          </p>
          <h1 className="text-[2.25rem] font-bold leading-[2.75rem] tracking-[-0.03em] text-foreground dashboard-phone:text-heading-h2 dashboard-phone:tracking-normal sm:text-[2.75rem] sm:leading-[3.25rem] dashboard-short:text-heading-h2 dashboard-short:tracking-normal dashboard-landscape:text-heading-h2 dashboard-landscape:tracking-normal xl:text-heading-h2 xl:tracking-normal">
            {t("heading")}
          </h1>
          <p className="text-[1.125rem] leading-6 text-muted-foreground dashboard-phone:text-body-b6 dashboard-short:text-body-b6 dashboard-landscape:text-body-b6 xl:text-body-b6">{t("count", { count: promoCodes.total })}</p>
        </div>
        <Button asChild size="lg" className="h-[3.75rem] min-w-[10.75rem] shrink-0 rounded-[1.125rem] px-5 text-body-b1 dashboard-phone:h-12 dashboard-phone:min-w-0 dashboard-phone:rounded-button dashboard-phone:px-4 dashboard-phone:text-button-btn4 dashboard-short:h-12 dashboard-short:min-w-0 dashboard-short:rounded-button dashboard-short:text-button-btn4 dashboard-landscape:h-12 dashboard-landscape:min-w-0 dashboard-landscape:rounded-button dashboard-landscape:text-button-btn4 xl:h-12 xl:min-w-0 xl:rounded-button xl:text-button-btn4">
          <Link href="/dashboard/promo-codes/create">
            <Icon icon={Plus} size="sm" className="me-1.5" />
            <span className="dashboard-landscape:hidden xl:hidden">{t("newPromoCodeShort")}</span>
            <span className="hidden dashboard-landscape:inline xl:inline">{t("newPromoCode")}</span>
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-[1.375rem] border border-border bg-background p-4 dashboard-phone:rounded-card-lg dashboard-phone:p-3 dashboard-short:rounded-card-lg dashboard-landscape:flex-row dashboard-landscape:items-center dashboard-landscape:rounded-card-lg xl:flex-row xl:items-center xl:rounded-card-lg">
        <ListSearchInput
          label={t("searchLabel")}
          placeholder={t("searchPlaceholder")}
          className="max-w-none flex-1 sm:max-w-none [&_input]:h-[3.75rem] [&_input]:text-[1.125rem] dashboard-phone:[&_input]:h-12 dashboard-phone:[&_input]:text-body-b2 dashboard-short:[&_input]:h-10 dashboard-short:[&_input]:text-body-b6 dashboard-landscape:max-w-md dashboard-landscape:[&_input]:h-10 dashboard-landscape:[&_input]:text-body-b6 xl:max-w-md xl:[&_input]:h-10 xl:[&_input]:text-body-b6"
        />
        <div className="flex items-center justify-between dashboard-landscape:ms-auto dashboard-landscape:justify-start dashboard-landscape:gap-2 xl:ms-auto xl:justify-start xl:gap-2">
          <ListFilterSelect
            paramName="status"
            label={t("filterStatusLabel")}
            options={[
              { value: "", label: t("filterStatusAll") },
              ...PROMO_CODE_STATUSES.map((status) => ({ value: status, label: statusLabels[status] })),
            ]}
            className="h-14 w-[10.375rem] rounded-[0.875rem] px-4 text-body-b2 dashboard-phone:h-11 dashboard-phone:w-[9rem] dashboard-phone:rounded-input dashboard-phone:px-3 dashboard-phone:text-body-b6 dashboard-short:h-9 dashboard-short:w-auto dashboard-short:rounded-input dashboard-short:px-3 dashboard-short:text-body-b7 dashboard-landscape:h-9 dashboard-landscape:w-auto dashboard-landscape:rounded-input dashboard-landscape:px-3 dashboard-landscape:text-body-b7 xl:h-9 xl:w-auto xl:rounded-input xl:px-3 xl:text-body-b7"
          />
          <ListFilterReset
            label={tList("clearFiltersShort")}
            paramNames={["q", "status"]}
            alwaysVisible
            className="font-semibold text-muted-foreground hover:text-foreground"
          />
        </div>
      </div>

      {promoCodes.items.length > 0 ? (
        <>
          <PromoCodesTable promoCodes={promoCodes.items} />
          <ListPager page={promoCodes} compact />
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
