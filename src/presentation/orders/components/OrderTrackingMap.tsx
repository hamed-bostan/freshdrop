"use client";

import "leaflet/dist/leaflet.css";

import * as React from "react";
import L from "leaflet";
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
    html: `<span style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:9999px;background:${background};color:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.25)">${glyph}</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

const SVG_ATTRS =
  'width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const HOME_GLYPH = `<svg xmlns="http://www.w3.org/2000/svg" ${SVG_ATTRS}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
const BIKE_GLYPH = `<svg xmlns="http://www.w3.org/2000/svg" ${SVG_ATTRS}><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>`;

const destinationIcon = badgeIcon("#11A94D", HOME_GLYPH);
const courierIcon = badgeIcon("#A9116D", BIKE_GLYPH);

/** Frames the map so both the courier and destination are visible. */
function FitToRoute({ from, to }: { from: GeoPoint; to: GeoPoint }) {
  const map = useMap();

  React.useEffect(() => {
    // Leaflet mis-measures inside flex/rounded containers that size after init.
    map.invalidateSize();
    map.fitBounds([toLatLng(from), toLatLng(to)], { padding: [48, 48] });
    // Depend on the coordinate values, not the object identities, so the fit
    // doesn't re-fire on every render with fresh-but-equal point props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, from.latitude, from.longitude, to.latitude, to.longitude]);

  return null;
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
      <Polyline positions={line} pathOptions={{ color: "#11A94D", weight: 4, dashArray: "6 10" }} />
      <Marker position={toLatLng(destination)} icon={destinationIcon} />
      <Marker position={toLatLng(courier)} icon={courierIcon} />
      <FitToRoute from={courier} to={destination} />
    </MapContainer>
  );
}
