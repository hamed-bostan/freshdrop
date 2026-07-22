import { notFound } from "next/navigation";
import { EditDeliveryWindowScreen } from "@/src/presentation/dashboard/delivery-slots/EditDeliveryWindowScreen";
import { deliveryWindowsServerApi } from "@/src/presentation/dashboard/delivery-slots/delivery-window-server-api";
import { requirePermission } from "@/src/lib/require-permission";

type EditDeliveryWindowPageProps = {
  params: Promise<{ id: string }>;
};

// The window is fetched over the REST API (BFF) during server render; a missing one
// renders the not-found boundary. The screen is presentational from there.
export const dynamic = "force-dynamic";

export default async function EditDeliveryWindowPage({ params }: EditDeliveryWindowPageProps) {
  // The layout only gates on `dashboard.view`; this whole section is a write
  // surface, so anyone without the permission is redirected rather than shown a
  // page whose every read would 401.
  await requirePermission("promotions.write");

  const { id } = await params;
  const window = await deliveryWindowsServerApi.getById(id);
  if (!window) notFound();

  return <EditDeliveryWindowScreen window={window} />;
}
