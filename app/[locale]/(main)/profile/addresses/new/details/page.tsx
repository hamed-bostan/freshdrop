import { isValidGeoPoint, type GeoPoint } from "@/src/domain/entities/Place";
import { ReverseGeocode } from "@/src/domain/use-cases/geocoding/ReverseGeocode";
import { geocodingRepository } from "@/src/infrastructure/container";
import { DEFAULT_CENTER } from "@/src/presentation/map/constants";
import LocationDetailScreen from "@/src/presentation/map/LocationDetailScreen";

interface LocationDetailsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ lat?: string; lon?: string; address?: string; city?: string }>;
}

export default async function LocationDetailsPage({ params, searchParams }: LocationDetailsPageProps) {
  const { locale } = await params;
  const { lat, lon, address, city } = await searchParams;
  const candidate: GeoPoint = { latitude: Number(lat), longitude: Number(lon) };

  // Fall back to the default if the coordinate is missing/invalid (e.g. deep link).
  const center = isValidGeoPoint(candidate) ? candidate : DEFAULT_CENTER;

  // Seed the Address and City fields with the location the user picked. The picker
  // forwards what it already reverse-geocoded, so that's the source of truth; only if
  // either is missing (e.g. a deep link straight to this step) do we resolve it here.
  let initialAddress = address ?? "";
  let initialCity = city ?? "";
  if (!initialAddress || !initialCity) {
    try {
      const place = await new ReverseGeocode(geocodingRepository).execute(center, { language: locale });
      if (!initialAddress) initialAddress = place?.address ?? "";
      if (!initialCity) initialCity = place?.city ?? "";
    } catch {
      // Geocoder unavailable (e.g. offline dev) — the user can still type them.
    }
  }

  return <LocationDetailScreen center={center} initialAddress={initialAddress} initialCity={initialCity} />;
}
