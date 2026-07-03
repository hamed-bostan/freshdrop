import Link from "next/link";
import { Pencil } from "lucide-react";
import { Icon } from "@/src/presentation/design-system";
import type { DeliveryLocation } from "@/src/domain/entities/DeliveryLocation";
import { DeliveryLocationSummary } from "./DeliveryLocationSummary";
import { RemoveAddressButton } from "./RemoveAddressButton";

interface AddressCardProps {
  location: DeliveryLocation;
}

/** One saved address on the Manage Address screen: summary + edit and remove affordances. */
export function AddressCard({ location }: AddressCardProps) {
  return (
    <div className="flex items-center justify-between gap-5 rounded-card-xl bg-surface px-4 py-2">
      <DeliveryLocationSummary location={location} />

      <div className="flex shrink-0 items-center gap-1">
        <Link
          href={`/profile/addresses/${location.id}/edit`}
          aria-label={`Edit ${location.label} address`}
          className="flex size-6 items-center justify-center text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon icon={Pencil} size="sm" />
        </Link>

        <RemoveAddressButton id={location.id} label={location.label} />
      </div>
    </div>
  );
}
