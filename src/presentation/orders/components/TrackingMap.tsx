"use client";

import dynamic from "next/dynamic";
import type { GeoPoint } from "@/src/domain/entities/Place";
import { Skeleton } from "@/src/presentation/design-system";

// Leaflet is client-only; load the map lazily and keep it out of the SSR bundle.
const OrderTrackingMap = dynamic(
  () => import("./OrderTrackingMap").then((mod) => mod.OrderTrackingMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
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
