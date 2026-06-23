import Link from "next/link";
import { Button } from "@/src/presentation/design-system";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import type { DeliveryLocation } from "@/src/domain/entities/DeliveryLocation";
import { AddressCard } from "./components/AddressCard";

interface ManageAddressesScreenProps {
  locations: DeliveryLocation[];
}

export default function ManageAddressesScreen({ locations }: ManageAddressesScreenProps) {
  return (
    <div className="flex min-h-dvh flex-col gap-6 px-6 pb-10">
      <PageHeader title="Manage Address" />

      <ul className="flex flex-col gap-4">
        {locations.map((location) => (
          <li key={location.id}>
            <AddressCard location={location} />
          </li>
        ))}
      </ul>

      <Button asChild size="lg" className="mt-auto w-full rounded-button-lg">
        <Link href="/profile/addresses/new">Add New Address</Link>
      </Button>
    </div>
  );
}
