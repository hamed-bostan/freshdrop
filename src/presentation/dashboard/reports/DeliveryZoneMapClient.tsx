"use client";

import dynamic from "next/dynamic";

import type { Locale } from "@/src/i18n/routing";
import { Skeleton } from "@/src/presentation/design-system";

import type { DeliveryZonesWire } from "./delivery-zones-response-schema";

// Leaflet is client-only; load the map lazily and keep it out of the SSR bundle.
const DeliveryZoneMapView = dynamic(
  () => import("./DeliveryZoneMapView").then((mod) => mod.DeliveryZoneMapView),
  { ssr: false, loading: () => <Skeleton className="h-full w-full" /> },
);

type DeliveryZoneMapClientProps = {
  zones: DeliveryZonesWire["zones"];
  ordersLabel: string;
  onTimeLabel: string;
  locale: Locale;
};

export function DeliveryZoneMapClient({ zones, ordersLabel, onTimeLabel, locale }: DeliveryZoneMapClientProps) {
  return <DeliveryZoneMapView zones={zones} ordersLabel={ordersLabel} onTimeLabel={onTimeLabel} locale={locale} />;
}
