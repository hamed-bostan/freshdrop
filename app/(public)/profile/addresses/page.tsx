import { GetDeliveryLocations } from "@/src/domain/use-cases/delivery-locations/GetDeliveryLocations";
import { deliveryLocationRepository } from "@/src/infrastructure/container";
import ManageAddressesScreen from "@/src/presentation/delivery-location/ManageAddressesScreen";

export default async function ManageAddressesPage() {
  const locations = await new GetDeliveryLocations(deliveryLocationRepository).execute();

  return <ManageAddressesScreen locations={locations} />;
}
