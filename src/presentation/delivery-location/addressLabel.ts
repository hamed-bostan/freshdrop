import type { DeliveryLocationKind } from "@/src/domain/entities/DeliveryLocation";

/**
 * Preset kinds → their label key under the `addresses` namespace. A preset address
 * stores an English label snapshot ("Home"/"Office"/"Gym"), so the presentation maps
 * it by the stable `kind` (like the payment-method labels) to render in the active
 * locale. `other` has no preset — its label is user-authored, shown as stored.
 */
export const ADDRESS_PRESET_LABEL_KEY: Partial<
  Record<DeliveryLocationKind, "presetHome" | "presetOffice" | "presetGym">
> = {
  home: "presetHome",
  office: "presetOffice",
  gym: "presetGym",
};
