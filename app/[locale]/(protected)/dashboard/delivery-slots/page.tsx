import { DeliverySlotsScreen } from "@/src/presentation/dashboard/delivery-slots/DeliverySlotsScreen";
import { deliveryWindowsServerApi } from "@/src/presentation/dashboard/delivery-slots/delivery-window-server-api";
import { requirePermission } from "@/src/lib/require-permission";

// The window catalog is fetched during server render over the REST API (BFF) and
// passed to the presentational screen. Mutations call router.refresh() to re-run
// this fetch, so the server stays the single source of truth. A failed fetch
// surfaces via the dashboard error boundary (error.tsx). The admin gate lives in
// the layout, and the BFF read forwards the admin's session cookie.
export const dynamic = "force-dynamic";

export default async function DashboardDeliverySlotsPage() {
  // The layout only gates on `dashboard.view`; this whole section is a write
  // surface, so anyone without the permission is redirected rather than shown a
  // page whose every read would 401.
  await requirePermission("promotions.write");

  const windows = await deliveryWindowsServerApi.list();
  return <DeliverySlotsScreen windows={windows} />;
}
