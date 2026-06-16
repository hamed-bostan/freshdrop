"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button } from "@/src/presentation/design-system";
import type { GeoPoint, Place } from "@/src/domain/entities/Place";
import { DEFAULT_ZOOM, FOCUS_ZOOM, type MapViewCommand } from "./constants";
import { LocationSearchBar, PlaceSearchResults, CenterPin, LocateButton } from "./components";
import { usePlaceSearch } from "./hooks/use-place-search";
import { useReverseGeocodedPlace } from "./hooks/use-reverse-geocode";

// Leaflet needs `window`, so the map is client-only and loaded lazily. Keeping
// this import here (not in the barrel) keeps Leaflet out of the SSR bundle.
const LocationMap = dynamic(() => import("./components/LocationMap").then((mod) => mod.LocationMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-muted-strong" />,
});

interface LocationPickerScreenProps {
  initialCenter: GeoPoint;
  /** Server-reverse-geocoded label for `initialCenter`, so the UI has a region on first paint. */
  initialPlace: Place | null;
}

export default function LocationPickerScreen({ initialCenter, initialPlace }: LocationPickerScreenProps) {
  const router = useRouter();

  const [query, setQuery] = React.useState("");
  // The map's current centre, updated on every move; `null` until the first move
  // so we don't redundantly re-reverse-geocode the server-seeded initial place.
  const [point, setPoint] = React.useState<GeoPoint | null>(null);
  const [viewCommand, setViewCommand] = React.useState<MapViewCommand>({
    center: initialCenter,
    zoom: DEFAULT_ZOOM,
    version: 0,
  });

  const { results, clear } = usePlaceSearch(query);
  const place = useReverseGeocodedPlace(point, initialPlace);

  const recenter = (center: GeoPoint, zoom = FOCUS_ZOOM) =>
    setViewCommand((command) => ({ center, zoom, version: command.version + 1 }));

  const handleSelectPlace = (selected: Place) => {
    setQuery("");
    clear();
    recenter(selected.point);
  };

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => recenter({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      undefined,
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const handleConfirm = () => {
    // Hand the chosen coordinate to the detail step, which collects the address
    // fields before the location is finally saved.
    const target = point ?? initialCenter;
    router.push(`/profile/addresses/new/details?lat=${target.latitude}&lon=${target.longitude}`);
  };

  return (
    <div className="relative flex h-dvh flex-col px-6 pt-1">
      <div className="relative flex-1 overflow-hidden">
        <LocationMap
          initialCenter={initialCenter}
          initialZoom={DEFAULT_ZOOM}
          viewCommand={viewCommand}
          onCenterChange={setPoint}
        />
        <CenterPin />

        {/* Floats over the map rather than occupying its own bar. */}
        <header className="absolute inset-x-0 top-0 z-[1100] px-4 pt-3">
          <LocationSearchBar
            query={query}
            region={place?.city ?? "Set region"}
            onQueryChange={setQuery}
            onBack={() => router.back()}
          />
          <PlaceSearchResults results={results} onSelect={handleSelectPlace} />
        </header>

        <LocateButton onClick={handleLocate} />
      </div>

      <footer className="bg-background p-4">
        <Button type="button" size="lg" className="w-full rounded-2xl" onClick={handleConfirm}>
          Add location
        </Button>
      </footer>
    </div>
  );
}
