import type { NewPromoCode } from "../../repositories/IPromoCodeRepository";
import { ValidationError } from "../../errors/ValidationError";

/**
 * The campaign invariants, shared by create and update so the two can't drift
 * apart — a rule enforced on the way in but not on the way back through the edit
 * form is no rule at all.
 *
 * The API routes re-validate the same submissions with the Zod contract
 * (`src/contracts/promo-code-schema.ts`), which is the *input* boundary: shape,
 * required fields, message keys for the form. These are the domain's own
 * guarantees, enforced for every caller regardless of which boundary they came
 * through. The overlap is deliberate and cheap.
 */

/** Trim and canonicalize the code's spelling; blanks become `undefined` windows. */
export function normalizePromoCode(input: NewPromoCode): NewPromoCode {
  return {
    ...input,
    code: input.code.trim().toUpperCase(),
    title: input.title.trim(),
    description: input.description.trim(),
  };
}

/** Throw a `ValidationError` naming the offending field, or return. */
export function assertValidPromoCode(promo: NewPromoCode): void {
  if (!promo.code) throw new ValidationError("code", "A code is required.");
  if (!promo.title) throw new ValidationError("title", "A title is required.");
  if (!promo.description) throw new ValidationError("description", "A description is required.");

  if (!Number.isInteger(promo.discountPercent) || promo.discountPercent < 1 || promo.discountPercent > 100) {
    throw new ValidationError("discountPercent", "Enter a whole discount between 1 and 100.");
  }

  // A window that closes before it opens can never be live, so the campaign would
  // silently do nothing — refuse it rather than store a code that can't be used.
  if (promo.startsAt && promo.endsAt && new Date(promo.endsAt) <= new Date(promo.startsAt)) {
    throw new ValidationError("endsAt", "The end date must be after the start date.");
  }
}
