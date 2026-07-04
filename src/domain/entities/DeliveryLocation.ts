export type DeliveryLocationKind = "home" | "office" | "gym" | "other";

export type DeliveryLocation = {
  id: string;
  label: string;
  address: string;
  /** Settlement (city / town) the address sits in, when the geocoder could resolve it. */
  city?: string;
  kind: DeliveryLocationKind;
  /** The coordinate picked on the map, when the address was added via the picker. */
  latitude?: number;
  longitude?: number;
  /** The address the user has chosen for checkout. Exactly one of a user's addresses is the default. */
  isDefault: boolean;
}
