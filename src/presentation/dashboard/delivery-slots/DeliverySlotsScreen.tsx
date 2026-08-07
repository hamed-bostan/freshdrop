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
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-heading-h2 text-foreground">{t("heading")}</h1>
          <p className="text-body-b6 text-muted-foreground">{t("subtitle", { days: formatNumber(SLOT_HORIZON_DAYS, locale) })}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/delivery-slots/create">
            <Icon icon={Plus} size="sm" className="me-1.5" />
            {t("newWindow")}
          </Link>
        </Button>
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
