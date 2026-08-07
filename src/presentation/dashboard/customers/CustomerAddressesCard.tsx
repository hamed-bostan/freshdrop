import { Dumbbell, House, MapPin, PackageCheck, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import type { DeliveryLocation } from "@/src/domain/entities/DeliveryLocation";
import { Badge, Icon } from "@/src/presentation/design-system";

import { PANEL_CLASS, PanelHeading } from "./PanelHeading";

const ADDRESS_ICON: Record<DeliveryLocation["kind"], LucideIcon> = {
  home: House,
  gym: Dumbbell,
  office: PackageCheck,
  other: MapPin,
};

export function CustomerAddressesCard({ addresses }: { addresses: DeliveryLocation[] }) {
  const t = useTranslations("dashCustomerDetail");

  return (
    <section className={PANEL_CLASS}>
      <PanelHeading icon={MapPin}>{t("addresses")}</PanelHeading>
      {addresses.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-3">
          {addresses.slice(0, 3).map((address, index) => (
            <li key={address.id} className="flex items-start gap-3">
              <span className={index === 0 ? "flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-primary" : "flex size-8 shrink-0 items-center justify-center rounded-full bg-info text-info-foreground"}>
                <Icon icon={ADDRESS_ICON[address.kind]} size="xs" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-body-b8 text-foreground">{address.label}</span>
                  {address.isDefault ? <Badge variant="primary" size="sm">{t("defaultAddress")}</Badge> : null}
                </div>
                <p className="line-clamp-2 text-body-b10 text-muted-foreground">{address.address}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="mt-3 text-body-b6 text-muted-foreground">{t("noAddresses")}</p>}
    </section>
  );
}
