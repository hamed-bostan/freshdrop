import { isValidGeoPoint, type GeoPoint } from "@/src/domain/entities/Place";
import LocationDetailScreen from "@/src/presentation/map/LocationDetailScreen";
import { DEFAULT_CENTER } from "@/src/presentation/map/constants";

interface LocationDetailsPageProps {
  searchParams: Promise<{ lat?: string; lon?: string }>;
}

export default async function LocationDetailsPage({ searchParams }: LocationDetailsPageProps) {
  const { lat, lon } = await searchParams;
  const candidate: GeoPoint = { latitude: Number(lat), longitude: Number(lon) };

  // Fall back to the default if the coordinate is missing/invalid (e.g. deep link).
  const center = isValidGeoPoint(candidate) ? candidate : DEFAULT_CENTER;

  return <LocationDetailScreen center={center} />;
}
