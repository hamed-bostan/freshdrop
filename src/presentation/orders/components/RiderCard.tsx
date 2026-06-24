import Image from "next/image";
import { MessageSquareText, Phone } from "lucide-react";
import type { DeliveryRider } from "@/src/domain/entities/OrderTracking";
import { Button, Icon } from "@/src/presentation/design-system";

interface RiderCardProps {
  rider: DeliveryRider;
}

/** Delivery courier with message and call shortcuts. */
export function RiderCard({ rider }: RiderCardProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-card-xl bg-surface p-2">
      <div className="flex min-w-0 items-center gap-4">
        <Image
          src={rider.avatarUrl}
          alt={rider.name}
          width={56}
          height={56}
          className="size-14 shrink-0 rounded-full object-cover"
        />
        <div className="flex min-w-0 flex-col gap-2">
          <p className="truncate text-body-b7 text-foreground">{rider.name}</p>
          <p className="truncate text-body-b10 text-muted-foreground">{rider.role}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button asChild iconOnly size="sm" aria-label={`Message ${rider.name}`}>
          <a href={`sms:${rider.phone}`}>
            <Icon icon={MessageSquareText} size="md" />
          </a>
        </Button>
        <Button asChild iconOnly size="sm" aria-label={`Call ${rider.name}`}>
          <a href={`tel:${rider.phone}`}>
            <Icon icon={Phone} size="md" />
          </a>
        </Button>
      </div>
    </div>
  );
}
