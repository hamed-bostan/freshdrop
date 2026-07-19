import { DeliverySlotsScreen } from "@/src/presentation/dashboard/delivery-slots/DeliverySlotsScreen";
import { deliveryWindowsServerApi } from "@/src/presentation/dashboard/delivery-slots/delivery-window-server-api";

// The window catalog is fetched during server render over the REST API (BFF) and
// passed to the presentational screen. Mutations call router.refresh() to re-run
// this fetch, so the server stays the single source of truth. A failed fetch
// surfaces via the dashboard error boundary (error.tsx). The admin gate lives in
// the layout, and the BFF read forwards the admin's session cookie.
export const dynamic = "force-dynamic";

export default async function DashboardDeliverySlotsPage() {
  const windows = await deliveryWindowsServerApi.list();
  return <DeliverySlotsScreen windows={windows} />;
}
