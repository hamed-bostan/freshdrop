"use client";

import "leaflet/dist/leaflet.css";

import * as React from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { Locale } from "@/src/i18n/routing";
import { formatPercent } from "@/src/lib/formatNumber";
import type { DeliveryZonesWire } from "./delivery-zones-response-schema";

type ZoneWithCentroid = DeliveryZonesWire["zones"][number] & { centroid: NonNullable<DeliveryZonesWire["zones"][number]["centroid"]> };

const DEFAULT_CENTER: [number, number] = [43.6532, -79.3832];

function onTimeColor(rate: number): string {
  if (rate >= 0.9) return "var(--color-primary)";
  if (rate >= 0.75) return "var(--color-warning-foreground)";
  return "var(--color-destructive)";
}

function FitToZones({ points }: { points: [number, number][] }) {
  const map = useMap();

  React.useEffect(() => {
    map.invalidateSize();
    if (points.length > 1) map.fitBounds(points, { padding: [32, 32] });
    else if (points.length === 1) map.setView(points[0], 12);
    // Fit once on mount, from the zone set the report loaded with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return null;
}

type DeliveryZoneMapViewProps = {
  zones: DeliveryZonesWire["zones"];
  ordersLabel: string;
  onTimeLabel: string;
  locale: Locale;
};

/**
 * Marker size is each zone's share of delivered orders; marker color is its
 * on-time rate. Positions are the average delivery coordinate of the zone's
 * orders (a real centroid of real deliveries) — not a drawn zone boundary,
 * since the app has no zone-polygon data to draw one from.
 */
export function DeliveryZoneMapView({ zones, ordersLabel, onTimeLabel, locale }: DeliveryZoneMapViewProps) {
  const located = zones.filter((zone): zone is ZoneWithCentroid => zone.centroid != null);
  const maxOrders = Math.max(...located.map((zone) => zone.orders), 1);
  const points = located.map((zone): [number, number] => [zone.centroid.latitude, zone.centroid.longitude]);

  return (
    <MapContainer center={points[0] ?? DEFAULT_CENTER} zoom={11} zoomControl={false} className="h-full w-full">
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />
      {located.map((zone) => (
        <CircleMarker
          key={zone.zone}
          center={[zone.centroid.latitude, zone.centroid.longitude]}
          radius={10 + (zone.orders / maxOrders) * 22}
          pathOptions={{ color: onTimeColor(zone.onTimeRate), fillColor: onTimeColor(zone.onTimeRate), fillOpacity: 0.55, weight: 2 }}
        >
          <Tooltip direction="top" offset={[0, -4]} opacity={1}>
            <div className="text-body-b10">
              <div className="font-semibold">{zone.zone}</div>
              <div>{ordersLabel}: {zone.orders}</div>
              <div>{onTimeLabel}: {formatPercent(zone.onTimeRate, locale)}</div>
            </div>
          </Tooltip>
        </CircleMarker>
      ))}
      <FitToZones points={points} />
    </MapContainer>
  );
}
