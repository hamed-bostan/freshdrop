import { notFound } from "next/navigation";
import { EditDeliveryWindowScreen } from "@/src/presentation/dashboard/delivery-slots/EditDeliveryWindowScreen";
import { deliveryWindowsServerApi } from "@/src/presentation/dashboard/delivery-slots/delivery-window-server-api";

type EditDeliveryWindowPageProps = {
  params: Promise<{ id: string }>;
};

// The window is fetched over the REST API (BFF) during server render; a missing one
// renders the not-found boundary. The screen is presentational from there.
export const dynamic = "force-dynamic";

export default async function EditDeliveryWindowPage({ params }: EditDeliveryWindowPageProps) {
  const { id } = await params;
  const window = await deliveryWindowsServerApi.getById(id);
  if (!window) notFound();

  return <EditDeliveryWindowScreen window={window} />;
}
