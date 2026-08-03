"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/src/presentation/design-system";
import type { DeliveryZonesWire } from "./delivery-zones-response-schema";

// Leaflet is client-only; load the map lazily and keep it out of the SSR bundle.
const DeliveryZoneMapView = dynamic(
  () => import("./DeliveryZoneMapView").then((mod) => mod.DeliveryZoneMapView),
  { ssr: false, loading: () => <Skeleton className="h-full w-full" /> },
);

interface DeliveryZoneMapClientProps {
  zones: DeliveryZonesWire["zones"];
  ordersLabel: string;
  onTimeLabel: string;
}

export function DeliveryZoneMapClient({ zones, ordersLabel, onTimeLabel }: DeliveryZoneMapClientProps) {
  return <DeliveryZoneMapView zones={zones} ordersLabel={ordersLabel} onTimeLabel={onTimeLabel} />;
}
