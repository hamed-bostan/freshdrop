import { ReverseGeocode } from "@/src/domain/use-cases/geocoding/ReverseGeocode";
import { geocodingRepository } from "@/src/infrastructure/container";
import LocationPickerScreen from "@/src/presentation/map/LocationPickerScreen";
import { DEFAULT_CENTER } from "@/src/presentation/map/constants";
import type { Place } from "@/src/domain/entities/Place";

export default async function NewAddressPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  let initialPlace: Place | null = null;

  try {
    // Seed the region label server-side (cached) so the picker isn't blank on first paint.
    initialPlace = await new ReverseGeocode(geocodingRepository).execute(DEFAULT_CENTER, { language: locale });
  } catch {
    // Geocoder unavailable (e.g. offline dev) — the picker still works without a seed.
  }

  return <LocationPickerScreen initialCenter={DEFAULT_CENTER} initialPlace={initialPlace} />;
}
