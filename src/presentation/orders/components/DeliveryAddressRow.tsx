import { useTranslations } from "next-intl";
import { MapPin } from "lucide-react";
import { Icon } from "@/src/presentation/design-system";

interface DeliveryAddressRowProps {
  address: string;
}

/** Labelled delivery address with a location-pin icon. */
export function DeliveryAddressRow({ address }: DeliveryAddressRowProps) {
  const t = useTranslations("orders");

  return (
    <div className="flex items-start gap-2 px-1.5">
      <Icon icon={MapPin} size="md" className="shrink-0 text-foreground" />
      <div className="flex flex-col gap-2">
        <p className="text-body-b7 text-foreground">{t("deliveryAddress")}</p>
        <p className="text-body-b10 text-muted-foreground">{address}</p>
      </div>
    </div>
  );
}
