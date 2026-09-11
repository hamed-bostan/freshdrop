import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { sessionPermissions } from "@/src/lib/require-permission";
import { EXPORT_REPORTS } from "@/src/presentation/dashboard/reports/export-report-catalog";
import { scheduledExportsServerApi } from "@/src/presentation/dashboard/reports/scheduled-export-server-api";
import { ScheduledExportForm } from "@/src/presentation/dashboard/reports/ScheduledExportForm";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export default async function EditScheduledExportPage({ params }: Props) {
  const { id } = await params;
  const schedule = await scheduledExportsServerApi.getById(id);
  if (!schedule) notFound();

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
        <h1 className="dashboard-page-title">{t("editHeading")}</h1>
        <p className="text-body-b6 text-muted-foreground">{t("editSubtitle")}</p>
      </div>
      <ScheduledExportForm mode="edit" schedule={schedule} reports={reports} />
    </div>
  );
}
