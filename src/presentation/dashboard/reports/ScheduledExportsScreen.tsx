import { ChevronRight, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { ScheduledExport } from "@/src/domain/entities/ScheduledExport";
import { Link } from "@/src/i18n/navigation";
import { Button, Icon } from "@/src/presentation/design-system";

import { ScheduledExportsTable } from "./ScheduledExportsTable";

type Props = { schedules: ScheduledExport[] };

/**
 * The Scheduled reports panel's "Manage schedules": every standing schedule
 * the caller may see, with full row actions (edit/delete) — the compact
 * panel embedded in the Export center only shows the Active toggle.
 */
export async function ScheduledExportsScreen({ schedules }: Props) {
  const t = await getTranslations("dashScheduledExports");
  const te = await getTranslations("dashExportReports");

  return (
    <div className="mx-auto flex w-full max-w-[1536px] flex-col gap-4">
      <nav aria-label={te("breadcrumbAria")} className="flex items-center gap-2 text-body-b10 text-muted-foreground">
        <Link href="/dashboard/reports/exports">{te("heading")}</Link>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-foreground">{t("manageHeading")}</span>
      </nav>

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-heading-h2">{t("manageHeading")}</h1>
          <p className="mt-1 text-body-b10 text-muted-foreground">{t("manageSubtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/reports/exports/schedules/create">
            <Icon icon={Plus} size="sm" className="me-1.5" />
            {t("createSchedule")}
          </Link>
        </Button>
      </header>

      {schedules.length > 0 ? (
        <ScheduledExportsTable schedules={schedules} showActions />
      ) : (
        <div className="rounded-card-lg border border-dashed border-border px-6 py-16 text-center">
          <p className="text-body-b4 text-foreground">{t("panelEmptyTitle")}</p>
          <p className="mt-1 text-body-b6 text-muted-foreground">{t("panelEmptyBody")}</p>
        </div>
      )}
    </div>
  );
}
