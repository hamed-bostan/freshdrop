"use client";

import dynamic from "next/dynamic";
import type { GeoPoint } from "@/src/domain/entities/Place";
import { DEFAULT_ZOOM, type MapViewCommand } from "../constants";
import { CenterPin } from "./CenterPin";

// Leaflet needs `window`, so the map is client-only and loaded lazily — the same
// out-of-SSR pattern the picker/preview screens use. Keeping the import here (not in
// the barrel) keeps Leaflet out of the SSR bundle.
const LocationMap = dynamic(() => import("./LocationMap").then((mod) => mod.LocationMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-muted-strong" />,
});

interface LocationRepinMapProps {
  /** Where the map opens; the coordinate under the pin as the user pans. */
  initialCenter: GeoPoint;
  /** Fires with the map centre (the chosen coordinate) after every pan. */
  onChange: (point: GeoPoint) => void;
  zoom?: number;
}

/**
 * An interactive pan-to-pin map: the user drags the map beneath a fixed centre pin,
 * and the coordinate under the pin is reported via `onChange`. Same composition as
 * the picker screen (`LocationMap` + `CenterPin`), minus the search/locate chrome —
 * used to re-position a saved address on the edit screen.
 */
export function LocationRepinMap({ initialCenter, onChange, zoom = DEFAULT_ZOOM }: LocationRepinMapProps) {
  // A version-0 command: the map opens at `initialCenter` and is never recentred
  // imperatively, so panning stays fully in the user's control.
  const viewCommand: MapViewCommand = { center: initialCenter, zoom, version: 0 };

  return (
    <div className="relative h-full w-full">
      <LocationMap
        initialCenter={initialCenter}
        initialZoom={zoom}
        viewCommand={viewCommand}
        onCenterChange={onChange}
      />
      <CenterPin />
    </div>
  );
}
