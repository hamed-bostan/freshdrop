import { useTranslations } from "next-intl";
import type { NotificationTemplateWire } from "@/src/presentation/dashboard/notification-templates/notification-template-response-schema";
import { NotificationTemplateEditor } from "@/src/presentation/dashboard/notification-templates/NotificationTemplateEditor";
import type { TaxSettingsWire } from "./tax-settings-response-schema";
import { TaxSettingsForm } from "./TaxSettingsForm";

type SettingsScreenProps = {
  /** The store's current VAT configuration, fetched over the BFF during server render. */
  taxSettings: TaxSettingsWire;
  /**
   * All 12 notification templates, fetched over the BFF during server render —
   * omitted (and the section hidden) when the session lacks `notifications.manage`.
   */
  notificationTemplates?: NotificationTemplateWire[];
};

/**
 * Store-wide configuration. Presentational: the dashboard page fetches the
 * settings over the REST API (BFF) during server render and passes them in;
 * a save re-runs that render via `router.refresh()`, so the server stays the
 * single source of truth and this screen holds no data state.
 *
 * One section today (VAT); a second settings group grows as a sibling card
 * here, not a rewrite.
 */
export function SettingsScreen({ taxSettings, notificationTemplates }: SettingsScreenProps) {
  const t = useTranslations("dashSettings");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-heading-h2 text-foreground">{t("heading")}</h1>
        <p className="text-body-b6 text-muted-foreground">{t("summary")}</p>
      </div>

      <TaxSettingsForm settings={taxSettings} />
      {notificationTemplates ? <NotificationTemplateEditor templates={notificationTemplates} /> : null}
    </div>
  );
}
