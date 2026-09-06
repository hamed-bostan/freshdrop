import { Plus } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import type { DeliveryWindow } from "@/src/domain/entities/DeliveryWindow";
import { SLOT_HORIZON_DAYS } from "@/src/domain/use-cases/delivery-slots/GetDeliverySlots";
import { Link } from "@/src/i18n/navigation";
import { formatNumber } from "@/src/lib/formatNumber";
import { Button, Icon } from "@/src/presentation/design-system";

import { DeliveryWindowsTable } from "./DeliveryWindowsTable";

type DeliverySlotsScreenProps = {
  windows: DeliveryWindow[];
};

/**
 * Admin delivery-slot screen. Presentational: the dashboard page fetches the
 * window catalog over the REST API (BFF) during server render and passes it in.
 * Mutations re-run this server render via `router.refresh()`, so the server stays
 * the single source of truth — no client-side data cache to keep in sync.
 *
 * The subtitle states the horizon because it's the missing half of what an
 * operator is editing: a window isn't a single slot, it's one repeated across
 * every day the store takes bookings for, each with its own capacity.
 */
export async function DeliverySlotsScreen({ windows }: DeliverySlotsScreenProps) {
  const t = await getTranslations("dashDeliverySlots");
  // A bare `{days}` argument is interpolated verbatim, so the numeral is localized
  // here rather than left Latin inside a Persian sentence.
  const locale = (await getLocale());

  return (
    <div className="flex w-full flex-col gap-6 dashboard-phone:gap-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h1 className="text-[2.75rem] font-bold leading-[3.25rem] tracking-[-0.03em] text-foreground dashboard-phone:text-heading-h2 dashboard-phone:tracking-normal dashboard-landscape:text-[2.75rem] dashboard-landscape:leading-[3.25rem] xl:text-heading-h2 xl:leading-normal xl:tracking-normal">
            {t("heading")}
          </h1>
        </div>
        <Button
          asChild
          className="h-14 min-w-40 shrink-0 rounded-[1.125rem] px-5 text-body-b4 dashboard-phone:size-11 dashboard-phone:min-w-0 dashboard-phone:rounded-button dashboard-phone:p-0 xl:h-10 xl:min-w-0 xl:rounded-button xl:px-4 xl:text-button-btn4"
        >
          <Link href="/dashboard/delivery-slots/create" aria-label={t("newWindow")}>
            <Icon icon={Plus} size="md" className="me-2 dashboard-phone:me-0 xl:me-1.5 xl:size-4" />
            <span className="dashboard-phone:sr-only">{t("newWindow")}</span>
          </Link>
        </Button>
        <p className="col-span-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
          {t("subtitle", { days: formatNumber(SLOT_HORIZON_DAYS, locale) })}
        </p>
      </div>

      {windows.length > 0 ? (
        <DeliveryWindowsTable windows={windows} />
      ) : (
        <div className="rounded-card-lg border border-dashed border-border px-6 py-16 text-center">
          <p className="text-body-b4 text-foreground">{t("emptyTitle")}</p>
          <p className="mt-1 text-body-b6 text-muted-foreground">{t("emptyBody")}</p>
        </div>
      )}
    </div>
  );
}
