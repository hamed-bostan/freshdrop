import { serverApiGet } from "@/src/lib/api/server-client";

import { taxSettingsResponseSchema, type TaxSettingsWire } from "./tax-settings-response-schema";

/** Server-side read of the store's VAT configuration for the settings page (BFF). */
export const taxSettingsServerApi = {
  get(): Promise<TaxSettingsWire> {
    return serverApiGet("/admin/tax-settings", taxSettingsResponseSchema);
  },
};
