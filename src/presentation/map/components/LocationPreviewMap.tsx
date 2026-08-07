"use client";

import "leaflet/dist/leaflet.css";

import * as React from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";

import type { GeoPoint } from "@/src/domain/entities/Place";

import { CenterPin } from "./CenterPin";

interface LocationPreviewMapProps {
  center: GeoPoint;
  zoom?: number;
}

function InvalidateOnMount() {
  const map = useMap();

  React.useEffect(() => {
    map.invalidateSize();
  }, [map]);

  return null;
}

/**
 * A small, non-interactive map thumbnail centred on a coordinate (with the
 * picker pin overlaid). All interaction is disabled — it's a read-only preview of
 * the location chosen on the previous step.
 */
export function LocationPreviewMap({ center, zoom = 15 }: LocationPreviewMapProps) {
  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[center.latitude, center.longitude]}
        zoom={zoom}
        zoomControl={false}
        attributionControl={false}
        dragging={false}
        doubleClickZoom={false}
        scrollWheelZoom={false}
        touchZoom={false}
        keyboard={false}
        className="h-full w-full"
      >
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
        <InvalidateOnMount />
      </MapContainer>
      <CenterPin />
    </div>
  );
}
