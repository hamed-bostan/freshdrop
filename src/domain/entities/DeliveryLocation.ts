export type DeliveryLocationKind = "home" | "office" | "gym" | "other";

export interface DeliveryLocation {
  id: string;
  label: string;
  address: string;
  kind: DeliveryLocationKind;
}
