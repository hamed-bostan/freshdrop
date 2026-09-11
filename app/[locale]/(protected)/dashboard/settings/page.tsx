import { requirePermission, sessionHas } from "@/src/lib/require-permission";
import { notificationTemplatesServerApi } from "@/src/presentation/dashboard/notification-templates/notification-template-server-api";
import { SettingsScreen } from "@/src/presentation/dashboard/settings/SettingsScreen";
import { taxSettingsServerApi } from "@/src/presentation/dashboard/settings/tax-settings-server-api";

// The rate is read during server render over the REST API (BFF) and passed to the
// presentational screen — never statically cached, so a change shows up on the
// next render. A save's router.refresh() re-runs this same render.
export const dynamic = "force-dynamic";

export default async function DashboardSettingsPage() {
  // The layout only gates on `dashboard.view`; this whole section is a write
  // surface, so anyone without the permission is redirected rather than shown a
  // page whose every read would 401.
  const session = await requirePermission("settings.write");

  const taxSettings = await taxSettingsServerApi.get();
  // `notifications.manage` is a separate permission from `settings.write` (see
  // Permission.ts) — fetched, and the section shown, only when the session
  // actually carries it, the same "don't offer a control that can only 401"
  // standing every guard here has.
  const notificationTemplates = (await sessionHas(session, "notifications.manage"))
    ? await notificationTemplatesServerApi.list()
    : undefined;

  return <SettingsScreen taxSettings={taxSettings} notificationTemplates={notificationTemplates} />;
}
