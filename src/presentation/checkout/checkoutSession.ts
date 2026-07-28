import type { SubstitutionPreference } from "@/src/domain/entities/Order";

export const SLOT_STORAGE_KEY = "freshdrop:checkout:slot";
export const SUBSTITUTIONS_STORAGE_KEY = "freshdrop:checkout:substitutions";
export const NOTES_STORAGE_KEY = "freshdrop:checkout:notes";

export function reviveSubstitutions(stored: Record<string, SubstitutionPreference>): Record<string, SubstitutionPreference> {
  if (typeof stored !== "object" || stored === null) return {};
  const clean: Record<string, SubstitutionPreference> = {};
  for (const [productId, preference] of Object.entries(stored)) {
    if (preference === "substitute" || preference === "refund" || preference === "contact") clean[productId] = preference;
  }
  return clean;
}
