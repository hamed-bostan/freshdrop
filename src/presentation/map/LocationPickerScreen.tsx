"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Button } from "@/src/presentation/design-system";
import type { GeoPoint, Place } from "@/src/domain/entities/Place";
import { useRouter } from "@/src/i18n/navigation";
import { DEFAULT_ZOOM, FOCUS_ZOOM, type MapViewCommand } from "./constants";
import { LocationSearchBar, PlaceSearchResults, CenterPin, LocateButton } from "./components";
import { usePlaceSearch } from "./hooks/use-place-search";
import { useReverseGeocodedPlace } from "./hooks/use-reverse-geocode";
import { reverseGeocode } from "./lib/geocoding-client";

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
  const t = useTranslations("addresses");
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
  const [confirming, startConfirm] = React.useTransition();

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
    // Save the exact coordinate the pin sits on, and resolve *its* address here so
    // the coordinate and its address stay in lockstep. We can't just forward the
    // `place` shown on the map: it's debounced and trails `point`. Most visibly,
    // right after "locate" the map has jumped to the user's position but the
    // reverse-geocode hasn't caught up, so `place` still holds the address the map
    // opened at (or none) — which is what leaked into the field before. Resolving
    // the confirmed coordinate now (cached, so usually instant) fixes that.
    const target = point ?? initialCenter;
    startConfirm(async () => {
      let address = "";
      let city = "";
      try {
        const resolved = await reverseGeocode(target);
        address = resolved?.address ?? "";
        city = resolved?.city ?? "";
      } catch {
        // Lookup failed — hand off with no address rather than a stale one; the
        // detail step falls back to resolving it server-side (or the user types it).
      }

      const params = new URLSearchParams({ lat: String(target.latitude), lon: String(target.longitude) });
      if (address) params.set("address", address);
      if (city) params.set("city", city);
      router.push(`/profile/addresses/new/details?${params.toString()}`);
    });
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
            region={place?.city ?? t("setRegion")}
            onQueryChange={setQuery}
            onBack={() => router.back()}
          />
          <PlaceSearchResults results={results} onSelect={handleSelectPlace} />
        </header>

        <LocateButton onClick={handleLocate} />
      </div>

      <footer className="bg-background p-4">
        <Button
          type="button"
          size="lg"
          className="w-full rounded-button-lg"
          onClick={handleConfirm}
          disabled={confirming}
        >
          {confirming ? t("confirmLoading") : t("addLocation")}
        </Button>
      </footer>
    </div>
  );
}
