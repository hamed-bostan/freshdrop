import { useTranslations } from "next-intl";
import { MapPin } from "lucide-react";
import type { DeliveryLocation } from "@/src/domain/entities/DeliveryLocation";
import { Badge, Icon } from "@/src/presentation/design-system";

type CustomerAddressesPanelProps = {
  /** The customer's saved delivery addresses. */
  addresses: DeliveryLocation[];
};

/**
 * A customer's saved delivery addresses — read-only. An admin needs to see where
 * this person's orders go (to make sense of a delivery complaint, or to recognise a
 * repeat address), but editing someone's address book from the dashboard would
 * change what their next order silently defaults to, so there are no controls here.
 *
 * The default address is called out, since that's the one checkout will pick.
 */
export function CustomerAddressesPanel({ addresses }: CustomerAddressesPanelProps) {
  const t = useTranslations("dashCustomerDetail");

  if (addresses.length === 0) {
    return <p className="text-body-b6 text-muted-foreground">{t("noAddresses")}</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {addresses.map((address) => (
        <li key={address.id} className="flex items-start gap-3">
          <Icon icon={MapPin} size="xs" className="mt-1 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-body-b8 text-foreground">{address.label}</span>
              {address.isDefault ? (
                <Badge variant="primary" size="sm">
                  {t("defaultAddress")}
                </Badge>
              ) : null}
            </div>
            <p className="text-body-b6 text-muted-foreground">{address.address}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
