import Link from "next/link";
import { Pencil } from "lucide-react";
import { Icon } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";
import type { DeliveryLocation } from "@/src/domain/entities/DeliveryLocation";
import { RemoveAddressButton } from "./RemoveAddressButton";
import { SelectAddressButton } from "./SelectAddressButton";

interface AddressCardProps {
  location: DeliveryLocation;
}

/**
 * One saved address on the Manage Address screen. The body selects the address as
 * the checkout default (highlighted with a border when selected); the trailing
 * controls edit and remove it.
 */
export function AddressCard({ location }: AddressCardProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-5 rounded-card-xl border bg-surface px-4 py-2",
        location.isDefault ? "border-foreground" : "border-transparent",
      )}
    >
      <SelectAddressButton location={location} />

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
