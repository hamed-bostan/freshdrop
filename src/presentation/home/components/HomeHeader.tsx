import type { DeliveryLocation } from "@/src/domain/entities/DeliveryLocation";
import { SearchBar } from "@/src/presentation/components/SearchBar";
import { DeliveryLocationSelector } from "@/src/presentation/delivery-location/DeliveryLocationSelector";

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
