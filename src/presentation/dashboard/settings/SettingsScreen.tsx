import { useTranslations } from "next-intl";

import type { NotificationTemplateWire } from "@/src/presentation/dashboard/notification-templates/notification-template-response-schema";
import { NotificationTemplateEditor } from "@/src/presentation/dashboard/notification-templates/NotificationTemplateEditor";

import { TaxSettingsForm } from "./TaxSettingsForm";

import type { TaxSettingsWire } from "./tax-settings-response-schema";

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
 * Each settings group owns its form and save action.
 */
export function SettingsScreen({ taxSettings, notificationTemplates }: SettingsScreenProps) {
  const t = useTranslations("dashSettings");

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-4 sm:gap-6">
      <div>
        <h1 className="dashboard-page-title">{t("heading")}</h1>
        <p className="mt-1 text-body-b6 leading-relaxed text-muted-foreground">{t("summary")}</p>
      </div>

      <TaxSettingsForm settings={taxSettings} />
      {notificationTemplates ? <NotificationTemplateEditor templates={notificationTemplates} /> : null}
    </div>
  );
}
