"use client";

import { useTranslations } from "next-intl";
import type { OrderTracking } from "@/src/domain/entities/OrderTracking";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { TrackingMap, TrackingEta, DeliveryAddressRow, TrackingStepper, RiderCard } from "./components";
import { useLiveTracking } from "./useLiveTracking";

interface OrderTrackScreenProps {
  /** Server-rendered tracking; the screen then polls to keep the courier live. */
  initialTracking: OrderTracking;
}

export default function OrderTrackScreen({ initialTracking }: OrderTrackScreenProps) {
  const t = useTranslations("orders");
  const tracking = useLiveTracking(initialTracking);

  return (
    <div className="flex min-h-dvh flex-col gap-4 px-6 pb-24">
      <PageHeader title={t("trackTitle")} />

      <TrackingEta etaMinutes={tracking.etaMinutes} steps={tracking.steps} />

      <TrackingMap destination={tracking.destination} courier={tracking.courier} route={tracking.route} />

      <div className="flex flex-col gap-6">
        <DeliveryAddressRow address={tracking.deliveryAddress} />
        <TrackingStepper steps={tracking.steps} />
      </div>

      <RiderCard rider={tracking.rider} />
    </div>
  );
}
