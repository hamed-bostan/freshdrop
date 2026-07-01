export type DeliveryLocationKind = "home" | "office" | "gym" | "other";

export type DeliveryLocation = {
  id: string;
  label: string;
  address: string;
  kind: DeliveryLocationKind;
  /** Optional second address line (apartment/block details) captured on save. */
  detailAddress?: string;
  /** Optional contact number for the delivery. */
  phone?: string;
  /** The coordinate picked on the map, when the address was added via the picker. */
  latitude?: number;
  longitude?: number;
}
