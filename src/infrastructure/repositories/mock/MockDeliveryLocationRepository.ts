import type { DeliveryLocation } from "@/src/domain/entities/DeliveryLocation";
import type { IDeliveryLocationRepository } from "@/src/domain/repositories/IDeliveryLocationRepository";

const DELIVERY_LOCATIONS: DeliveryLocation[] = [
  { id: "1", label: "Home", address: "123 Maple Street, Toronto, ON M5H 2N2", kind: "home" },
  { id: "2", label: "Office", address: "78 King St, Toronto, ON, Canada", kind: "office" },
  { id: "3", label: "Gym", address: "FitZone Gym, 250 Front St W, Toronto, ON", kind: "gym" },
  { id: "4", label: "Friend's Home", address: "72 Queen's Park Crescent, Toronto, ON", kind: "other" },
];

export class MockDeliveryLocationRepository implements IDeliveryLocationRepository {
  async getAll(): Promise<DeliveryLocation[]> {
    return DELIVERY_LOCATIONS;
  }
}
