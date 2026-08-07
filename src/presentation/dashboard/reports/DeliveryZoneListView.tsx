import type { Locale } from "@/src/i18n/routing";
import { formatNumber, formatPercent } from "@/src/lib/formatNumber";

import { demandColor, onTimeColor } from "./deliveryZoneColor";

import type { DeliveryZonesWire } from "./delivery-zones-response-schema";
import type { ZoneMapMetric } from "./DeliveryZoneMapView";

type DeliveryZoneListViewProps = {
  zones: DeliveryZonesWire["zones"];
  locale: Locale;
  metric: ZoneMapMetric;
  ordersLabel: string;
  onTimeLabel: string;
};

/** The map's "List" alternative — the same real per-zone figures and color scale, as rows instead of markers. */
export function DeliveryZoneListView({ zones, locale, metric, ordersLabel, onTimeLabel }: DeliveryZoneListViewProps) {
  const maxOrders = Math.max(...zones.map((zone) => zone.orders), 1);
  const sorted = [...zones].sort((a, b) => metric === "demand" ? b.orders - a.orders : b.onTimeRate - a.onTimeRate);
  return (
    <div className="mt-2 h-[245px] overflow-y-auto rounded-card-md border border-border">
      {sorted.map((zone) => (
        <div key={zone.zone} className="flex items-center gap-3 border-b border-border px-3 py-2 text-body-b10 last:border-b-0">
          <span className="size-2.5 shrink-0 rounded-full" style={{ background: metric === "demand" ? demandColor(zone.orders / maxOrders) : onTimeColor(zone.onTimeRate) }} />
          <span className="min-w-0 flex-1 truncate font-medium">{zone.zone}</span>
          <span className="whitespace-nowrap text-muted-foreground">{ordersLabel} {formatNumber(zone.orders, locale)}</span>
          <span className="whitespace-nowrap text-muted-foreground">{onTimeLabel} {formatPercent(zone.onTimeRate, locale)}</span>
        </div>
      ))}
    </div>
  );
}
