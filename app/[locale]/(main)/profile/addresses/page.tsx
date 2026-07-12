import { deliveryLocationsServerApi } from "@/src/presentation/delivery-location/delivery-location-server-api";
import ManageAddressesScreen from "@/src/presentation/delivery-location/ManageAddressesScreen";

// Fetched from the REST API at request time (BFF) — render dynamically.
export const dynamic = "force-dynamic";

export default async function ManageAddressesPage() {
  const locations = await deliveryLocationsServerApi.list();

  return <ManageAddressesScreen locations={locations} />;
}
