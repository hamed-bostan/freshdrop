import { MessageSquareText, Phone } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import type { DeliveryRider } from "@/src/domain/entities/OrderTracking";
import { Avatar, Button, Icon } from "@/src/presentation/design-system";

interface RiderCardProps {
  rider: DeliveryRider;
}

/** Delivery courier with message and call shortcuts. */
export function RiderCard({ rider }: RiderCardProps) {
  const t = useTranslations("orders");

  return (
    <div className="flex items-center justify-between gap-4 rounded-card-xl bg-surface p-2">
      <div className="flex min-w-0 items-center gap-4">
        <Avatar tone="surface" name={rider.name} className="size-14">
          <Image src={rider.avatarUrl} alt="" width={56} height={56} className="size-full object-cover" />
        </Avatar>
        <div className="flex min-w-0 flex-col gap-2">
          <p className="truncate text-body-b7 text-foreground">{rider.name}</p>
          <p className="truncate text-body-b10 text-muted-foreground">{t("riderRole")}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button asChild iconOnly size="sm" aria-label={t("messageRider", { name: rider.name })}>
          <a href={`sms:${rider.phone}`}>
            <Icon icon={MessageSquareText} size="md" />
          </a>
        </Button>
        <Button asChild iconOnly size="sm" aria-label={t("callRider", { name: rider.name })}>
          <a href={`tel:${rider.phone}`}>
            <Icon icon={Phone} size="md" />
          </a>
        </Button>
      </div>
    </div>
  );
}
