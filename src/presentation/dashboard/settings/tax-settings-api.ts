import type { TaxSettingsFormInput } from "@/src/contracts/tax-settings-schema";
import { apiPut } from "@/src/lib/api/client";

import { taxSettingsResponseSchema, type TaxSettingsWire } from "./tax-settings-response-schema";

/**
 * Typed client for saving the store's VAT configuration. Sends the form's raw
 * (untransformed) values — the route handler re-validates with the same
 * `taxSettingsFormSchema` and does the string→number transform server-side.
 */
export const taxSettingsApi = {
  update(values: TaxSettingsFormInput): Promise<TaxSettingsWire> {
    return apiPut("/admin/tax-settings", values, taxSettingsResponseSchema);
  },
};
