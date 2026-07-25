import { SettingsScreen } from "@/src/presentation/dashboard/settings/SettingsScreen";
import { taxSettingsServerApi } from "@/src/presentation/dashboard/settings/tax-settings-server-api";
import { requirePermission } from "@/src/lib/require-permission";

// The rate is read during server render over the REST API (BFF) and passed to the
// presentational screen — never statically cached, so a change shows up on the
// next render. A save's router.refresh() re-runs this same render.
export const dynamic = "force-dynamic";

export default async function DashboardSettingsPage() {
  // The layout only gates on `dashboard.view`; this whole section is a write
  // surface, so anyone without the permission is redirected rather than shown a
  // page whose every read would 401.
  await requirePermission("settings.write");

  const taxSettings = await taxSettingsServerApi.get();
  return <SettingsScreen taxSettings={taxSettings} />;
}
