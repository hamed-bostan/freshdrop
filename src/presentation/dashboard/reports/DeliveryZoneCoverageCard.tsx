"use client";

import * as React from "react";

import type { Locale } from "@/src/i18n/routing";
import { ChartSegmentedControl } from "@/src/presentation/dashboard/ChartSegmentedControl";

import { DeliveryZoneListView } from "./DeliveryZoneListView";
import { DeliveryZoneMapClient } from "./DeliveryZoneMapClient";

import type { DeliveryZonesWire } from "./delivery-zones-response-schema";
import type { ZoneMapMetric } from "./DeliveryZoneMapView";

type View = "map" | "list";

type Labels = {
  title: string;
  map: string;
  list: string;
  demand: string;
  onTime: string;
  orders: string;
  lowDemand: string;
  highDemand: string;
  onTimeLegend: string;
  mapAria: string;
};

/** The "Zone coverage & demand" card: a Demand/On-time-rate metric toggle over a Map/List view toggle, both driven by the same real per-zone figures. */
export function DeliveryZoneCoverageCard({ zones, locale, labels }: { zones: DeliveryZonesWire["zones"]; locale: Locale; labels: Labels }) {
  const [metric, setMetric] = React.useState<ZoneMapMetric>("demand");
  const [view, setView] = React.useState<View>("map");

  return (
    <section className="relative z-0 isolate h-full rounded-card-lg border border-border bg-background p-4 md:p-6 xl:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="max-w-52 text-heading-h3 md:max-w-none">{labels.title}</h2>
        <ChartSegmentedControl className="w-auto" value={view} options={["map", "list"] as const} label={labels.mapAria} onChange={setView} getLabel={(value) => value === "map" ? labels.map : labels.list} emphasis />
      </div>
      <div className="mt-4"><ChartSegmentedControl className="sm:w-full" value={metric} options={["demand", "onTime"] as const} label={labels.title} onChange={setMetric} getLabel={(value) => value === "demand" ? labels.demand : labels.onTime} emphasis /></div>
      {view === "map"
        ? <div className="relative z-0 isolate mt-3 h-[360px] overflow-hidden rounded-card-md border border-border md:h-[420px] xl:h-[480px]" aria-label={labels.mapAria}><DeliveryZoneMapClient zones={zones} ordersLabel={labels.orders} onTimeLabel={labels.onTime} locale={locale} metric={metric} /></div>
        : <DeliveryZoneListView zones={zones} locale={locale} metric={metric} ordersLabel={labels.orders} onTimeLabel={labels.onTime} />}
      {metric === "demand"
        ? <p className="mt-2 flex items-center gap-1.5 text-label-l1 text-muted-foreground">{labels.lowDemand}<span className="flex items-center gap-1"><Dot tone="var(--color-info-foreground)" /><Dot tone="var(--color-warning-foreground)" /><Dot tone="var(--color-primary)" /></span>{labels.highDemand}</p>
        : <p className="mt-2 text-label-l1 text-muted-foreground">{labels.onTimeLegend}</p>}
    </section>
  );
}

function Dot({ tone }: { tone: string }) { return <span className="size-1.5 rounded-full" style={{ background: tone }} />; }
