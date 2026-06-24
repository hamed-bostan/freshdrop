import type { OrderTracking } from "@/src/domain/entities/OrderTracking";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { TrackingMap, DeliveryAddressRow, TrackingStepper, RiderCard } from "./components";

interface OrderTrackScreenProps {
  tracking: OrderTracking;
}

export default function OrderTrackScreen({ tracking }: OrderTrackScreenProps) {
  return (
    <div className="flex min-h-dvh flex-col gap-4 px-6 pb-24">
      <PageHeader title="Order Track" />

      <TrackingMap destination={tracking.destination} courier={tracking.courier} route={tracking.route} />

      <div className="flex flex-col gap-6">
        <DeliveryAddressRow address={tracking.deliveryAddress} />
        <TrackingStepper steps={tracking.steps} />
      </div>

      <RiderCard rider={tracking.rider} />
    </div>
  );
}
