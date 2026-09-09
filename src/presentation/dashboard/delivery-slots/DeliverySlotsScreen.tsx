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
    <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h1 className="text-[clamp(1.75rem,4vw,2rem)] font-bold leading-[1.2] text-foreground">
            {t("heading")}
          </h1>
        </div>
        <Button
          asChild
          className="size-11 shrink-0 p-0 text-body-b7 sm:h-10 sm:w-auto sm:px-4"
        >
          <Link href="/dashboard/delivery-slots/create" aria-label={t("newWindow")}>
            <Icon icon={Plus} size="sm" className="sm:me-1.5" />
            <span className="sr-only sm:not-sr-only">{t("newWindow")}</span>
          </Link>
        </Button>
        <p className="col-span-2 max-w-xl text-body-b6 leading-relaxed text-muted-foreground sm:text-body-b2">
          {t("subtitle", { days: formatNumber(SLOT_HORIZON_DAYS, locale) })}
        </p>
      </div>

      <DeliveryWindowsTable
        windows={windows}
        emptyState={(
          <div className="px-6 py-16 text-center">
            <p className="text-body-b4 text-foreground">{t("emptyTitle")}</p>
            <p className="mt-1 text-body-b6 text-muted-foreground">{t("emptyBody")}</p>
          </div>
        )}
      />
    </div>
  );
}
