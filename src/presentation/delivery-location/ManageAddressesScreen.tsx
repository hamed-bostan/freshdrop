import { getTranslations } from "next-intl/server";
import { Button } from "@/src/presentation/design-system";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { Link } from "@/src/i18n/navigation";
import type { DeliveryLocation } from "@/src/domain/entities/DeliveryLocation";
import { AddressCard } from "./components/AddressCard";

interface ManageAddressesScreenProps {
  locations: DeliveryLocation[];
  /** Where the back control returns to — the caller's screen (Profile, or checkout). */
  backHref?: string;
}

export default async function ManageAddressesScreen({ locations, backHref = "/profile" }: ManageAddressesScreenProps) {
  const t = await getTranslations("addresses");

  return (
    <div className="flex min-h-dvh flex-col gap-6 px-6 pb-10">
      <PageHeader title={t("manageTitle")} backHref={backHref} />

      <ul className="flex flex-col gap-4">
        {locations.map((location) => (
          <li key={location.id}>
            <AddressCard location={location} />
          </li>
        ))}
      </ul>

      <Button asChild size="lg" className="mt-auto w-full rounded-button-lg">
        <Link href="/profile/addresses/new">{t("addNew")}</Link>
      </Button>
    </div>
  );
}
