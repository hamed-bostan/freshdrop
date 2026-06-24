"use client";

import dynamic from "next/dynamic";
import type { GeoPoint } from "@/src/domain/entities/Place";

// Leaflet is client-only; load the map lazily and keep it out of the SSR bundle.
const OrderTrackingMap = dynamic(
  () => import("./OrderTrackingMap").then((mod) => mod.OrderTrackingMap),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse bg-muted-strong" />,
  },
);

interface TrackingMapProps {
  destination: GeoPoint;
  courier: GeoPoint;
  route: GeoPoint[];
}

/** The delivery route map, framed to the screen's card treatment. */
export function TrackingMap({ destination, courier, route }: TrackingMapProps) {
  return (
    <div className="h-[250px] overflow-hidden rounded-card-xl bg-surface-sunken">
      <OrderTrackingMap destination={destination} courier={courier} route={route} />
    </div>
  );
}
