export type DeliveryLocationKind = "home" | "office" | "gym" | "other";

export type DeliveryLocation = {
  id: string;
  label: string;
  address: string;
  kind: DeliveryLocationKind;
  /** The coordinate picked on the map, when the address was added via the picker. */
  latitude?: number;
  longitude?: number;
}
