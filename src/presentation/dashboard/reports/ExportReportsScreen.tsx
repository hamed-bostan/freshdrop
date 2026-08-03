import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { Icon } from "@/src/presentation/design-system";
import { CustomExportBuilder } from "./CustomExportBuilder";
import { EXPORT_REPORTS } from "./export-report-catalog";

export async function ExportReportsScreen() {
  const t = await getTranslations("dashExportReports");
  return (
    <div className="mx-auto flex w-full max-w-[1536px] flex-col gap-4">
      <nav aria-label={t("breadcrumbAria")} className="flex items-center gap-2 text-body-b10 text-muted-foreground">
        <Link href="/dashboard/reports">{t("reports")}</Link>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-foreground">{t("heading")}</span>
      </nav>
      <header>
        <h1 className="text-heading-h2">{t("heading")}</h1>
        <p className="mt-1 text-body-b10 text-muted-foreground">{t("subtitle")}</p>
      </header>
      <section>
        <h2 className="text-body-b7">{t("quickHeading")}</h2>
        <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {EXPORT_REPORTS.map((report, index) => (
            <article key={report.id} className="flex items-center gap-3 rounded-card-lg border border-border bg-background p-4">
              <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-card-md ${["bg-accent text-primary", "bg-info text-info-foreground", "bg-muted text-secondary", "bg-error text-destructive"][index]}`}
              >
                <Icon icon={report.icon} size="md" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-body-b8 font-semibold">{t(`report.${report.id}.name`)}</h3>
                <p className="mt-1 text-body-b10 text-muted-foreground">{t(`report.${report.id}.description`)}</p>
              </div>
              <a href={report.endpoint} download className="shrink-0 rounded-input border border-border px-4 py-2 text-body-b10 font-semibold">
                {t("export")}
              </a>
            </article>
          ))}
        </div>
      </section>
      <CustomExportBuilder />
    </div>
  );
}
