import { isValidGeoPoint, type GeoPoint } from "@/src/domain/entities/Place";
import { ReverseGeocode } from "@/src/domain/use-cases/geocoding/ReverseGeocode";
import { geocodingRepository } from "@/src/infrastructure/container";
import LocationDetailScreen from "@/src/presentation/map/LocationDetailScreen";
import { DEFAULT_CENTER } from "@/src/presentation/map/constants";

interface LocationDetailsPageProps {
  searchParams: Promise<{ lat?: string; lon?: string; address?: string }>;
}

export default async function LocationDetailsPage({ searchParams }: LocationDetailsPageProps) {
  const { lat, lon, address } = await searchParams;
  const candidate: GeoPoint = { latitude: Number(lat), longitude: Number(lon) };

  // Fall back to the default if the coordinate is missing/invalid (e.g. deep link).
  const center = isValidGeoPoint(candidate) ? candidate : DEFAULT_CENTER;

  // Seed the Address field with the location the user picked. The picker forwards
  // the address it already reverse-geocoded, so that's the source of truth; only if
  // it's missing (e.g. a deep link straight to this step) do we resolve it here.
  let initialAddress = address ?? "";
  if (!initialAddress) {
    try {
      const place = await new ReverseGeocode(geocodingRepository).execute(center);
      initialAddress = place?.address ?? "";
    } catch {
      // Geocoder unavailable (e.g. offline dev) — the user can still type the address.
    }
  }

  return <LocationDetailScreen center={center} initialAddress={initialAddress} />;
}
