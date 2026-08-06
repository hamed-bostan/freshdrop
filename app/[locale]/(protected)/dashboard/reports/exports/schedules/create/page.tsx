import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { EXPORT_REPORTS } from "@/src/presentation/dashboard/reports/export-report-catalog";
import { ScheduledExportForm } from "@/src/presentation/dashboard/reports/ScheduledExportForm";
import { sessionPermissions } from "@/src/lib/require-permission";

export const dynamic = "force-dynamic";

export default async function CreateScheduledExportPage() {
  const t = await getTranslations("dashScheduledExports");
  const session = await auth();
  const permissions = await sessionPermissions(session);
  const reports = EXPORT_REPORTS.filter((report) => permissions.includes(report.permission)).map((report) => ({
    id: report.id,
    endpoint: report.endpoint,
    periodCapable: report.periodCapable,
  }));

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-heading-h2 text-foreground">{t("createSchedule")}</h1>
        <p className="text-body-b6 text-muted-foreground">{t("createSubtitle")}</p>
      </div>
      <ScheduledExportForm mode="create" reports={reports} />
    </div>
  );
}
