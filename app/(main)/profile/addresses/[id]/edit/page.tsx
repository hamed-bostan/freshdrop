import { notFound } from "next/navigation";
import { deliveryLocationsServerApi } from "@/src/presentation/delivery-location/delivery-location-server-api";
import LocationDetailScreen from "@/src/presentation/map/LocationDetailScreen";
import { DEFAULT_CENTER } from "@/src/presentation/map/constants";
import { isValidGeoPoint, type GeoPoint } from "@/src/domain/entities/Place";

// The address is read from the REST API per request (BFF) — render dynamically.
export const dynamic = "force-dynamic";

interface EditAddressPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditAddressPage({ params }: EditAddressPageProps) {
  const { id } = await params;

  const location = await deliveryLocationsServerApi.getById(id);
  if (!location) notFound();

  // Preview the map at the saved coordinate; fall back to the default for older
  // addresses saved without one.
  const candidate: GeoPoint = { latitude: location.latitude ?? NaN, longitude: location.longitude ?? NaN };
  const center = isValidGeoPoint(candidate) ? candidate : DEFAULT_CENTER;

  return <LocationDetailScreen center={center} location={location} />;
}
