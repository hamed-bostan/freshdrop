import { getTranslations } from "next-intl/server";
import { Button } from "@/src/presentation/design-system";
import { Link } from "@/src/i18n/navigation";

/** Shown when editing a schedule that no longer exists (the page called `notFound()`). */
export default async function EditScheduledExportNotFound() {
  const t = await getTranslations("dashScheduledExports");

  return (
    <div className="flex max-w-xl flex-col gap-3">
      <h1 className="text-heading-h2 text-foreground">{t("notFoundTitle")}</h1>
      <p className="text-body-b6 text-muted-foreground">{t("notFoundBody")}</p>
      <Button asChild variant="outline" size="sm" className="self-start">
        <Link href="/dashboard/reports/exports/schedules">{t("backToSchedules")}</Link>
      </Button>
    </div>
  );
}
