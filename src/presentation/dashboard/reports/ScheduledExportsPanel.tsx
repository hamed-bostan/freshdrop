import { getTranslations } from "next-intl/server";

import { Link } from "@/src/i18n/navigation";

import { scheduledExportsServerApi } from "./scheduled-export-server-api";
import { ScheduledExportsTable } from "./ScheduledExportsTable";

/** How many rows the Export center's compact panel shows before pointing at the full manager. */
const PANEL_ROW_LIMIT = 5;

/**
 * The Export center's "Scheduled reports" panel: the standing recurring
 * rules, with their next-run time and a quick Active toggle, plus a link to
 * the full `/schedules` management route for creating, editing and deleting
 * them. The panel itself is read-mostly by design — see `ScheduledExportsTable`'s
 * `showActions`.
 */
export async function ScheduledExportsPanel() {
  const t = await getTranslations("dashScheduledExports");
  const schedules = await scheduledExportsServerApi.list();

  return (
    <section className="min-w-0 rounded-card-lg border border-border bg-background p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-body-b1">{t("panelHeading")}</h2>
          <p className="mt-1 text-body-b10 text-muted-foreground">{t("panelSubtitle")}</p>
        </div>
        <Link href="/dashboard/reports/exports/schedules" className="text-body-b10 font-semibold text-primary hover:underline">
          {t("manageSchedules")}
        </Link>
      </div>

      {schedules.length > 0 ? (
        <div className="mt-3">
          <ScheduledExportsTable schedules={schedules.slice(0, PANEL_ROW_LIMIT)} />
        </div>
      ) : (
        <div className="mt-5 rounded-card-md border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
          <p className="text-body-b8 text-muted-foreground">{t("panelEmpty")}</p>
          <Link href="/dashboard/reports/exports/schedules/create" className="mt-2 inline-block text-body-b10 font-semibold text-primary hover:underline">
            {t("createSchedule")}
          </Link>
        </div>
      )}
    </section>
  );
}
