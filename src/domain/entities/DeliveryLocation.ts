export type DeliveryLocationKind = "home" | "office" | "gym" | "other";

export type DeliveryLocation = {
  id: string;
  label: string;
  address: string;
  kind: DeliveryLocationKind;
}
