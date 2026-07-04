import type { DeliveryLocation } from "@/src/domain/entities/DeliveryLocation";
import { DeliveryLocationSelector } from "@/src/presentation/delivery-location/DeliveryLocationSelector";
import { SearchBar } from "@/src/presentation/components/SearchBar";

interface HomeHeaderProps {
  deliveryLocations: DeliveryLocation[];
}

export function HomeHeader({ deliveryLocations }: HomeHeaderProps) {
  return (
    <header className="pt-3">
      <div className="mb-4 flex justify-center">
        <DeliveryLocationSelector locations={deliveryLocations} />
      </div>

      <SearchBar />
    </header>
  );
}
