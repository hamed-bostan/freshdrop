"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import * as React from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";

import type { GeoPoint } from "@/src/domain/entities/Place";

const toLatLng = (point: GeoPoint): [number, number] => [point.latitude, point.longitude];

// HTML `divIcon`s instead of Leaflet's default image markers: no marker-image
// asset to bundle (the classic broken-icon pitfall) and we can brand them with
// the design-system colours. Built once at module scope — this file is loaded
// client-only (via `next/dynamic ssr:false`), so `L` is always available here.
function badgeIcon(background: string, glyph: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<span style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:9999px;background:${background};color:var(--color-primary-foreground);box-shadow:var(--shadow-marker)">${glyph}</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

const SVG_ATTRS =
  'width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const HOME_GLYPH = `<svg xmlns="http://www.w3.org/2000/svg" ${SVG_ATTRS}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
const BIKE_GLYPH = `<svg xmlns="http://www.w3.org/2000/svg" ${SVG_ATTRS}><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>`;

const destinationIcon = badgeIcon("var(--color-primary)", HOME_GLYPH);
const courierIcon = badgeIcon("var(--color-secondary)", BIKE_GLYPH);

/**
 * Frames the map to the whole route once, on mount. The route is fixed, so the
 * viewport stays put while the courier glides inside it — you "watch the driver
 * approach" instead of the map re-panning on every position update.
 */
function FitToRoute({ line }: { line: [number, number][] }) {
  const map = useMap();

  React.useEffect(() => {
    // Leaflet mis-measures inside flex/rounded containers that size after init.
    map.invalidateSize();
    map.fitBounds(line, { padding: [48, 48] });
    // Fit only once; the frame is intentionally stable across courier updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return null;
}

const COURIER_TWEEN_MS = 1200;

/**
 * The courier marker, animated. On each new `position` (a fresh poll) it eases
 * from where it was to the new point over {@link COURIER_TWEEN_MS}, so the
 * marker glides along the road rather than teleporting every 10 seconds.
 */
function CourierMarker({ position }: { position: GeoPoint }) {
  const markerRef = React.useRef<L.Marker>(null);
  const fromRef = React.useRef(position);

  React.useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    const from = fromRef.current;
    const start = performance.now();
    let frame = 0;

    const step = (now: number): void => {
      const t = Math.min((now - start) / COURIER_TWEEN_MS, 1);
      marker.setLatLng([
        from.latitude + (position.latitude - from.latitude) * t,
        from.longitude + (position.longitude - from.longitude) * t,
      ]);
      if (t < 1) frame = requestAnimationFrame(step);
      else fromRef.current = position;
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
    // Tween on coordinate *values*; `position` identity changes every poll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position.latitude, position.longitude]);

  return <Marker ref={markerRef} position={toLatLng(position)} icon={courierIcon} />;
}

interface OrderTrackingMapProps {
  destination: GeoPoint;
  courier: GeoPoint;
  route: GeoPoint[];
}

/** Interactive delivery map: the route from the courier to the destination. */
export function OrderTrackingMap({ destination, courier, route }: OrderTrackingMapProps) {
  const line = (route.length > 1 ? route : [courier, destination]).map(toLatLng);

  return (
    <MapContainer center={toLatLng(courier)} zoom={14} zoomControl={false} className="h-full w-full">
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />
      <Polyline positions={line} pathOptions={{ color: "var(--color-primary)", weight: 4, dashArray: "6 10" }} />
      <Marker position={toLatLng(destination)} icon={destinationIcon} />
      <CourierMarker position={courier} />
      <FitToRoute line={line} />
    </MapContainer>
  );
}
