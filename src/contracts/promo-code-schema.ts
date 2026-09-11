import { z } from "zod";

/**
 * The single source of truth for promo-code form input, shared by the client form
 * (React Hook Form resolver) and the REST route handlers (defensive re-validation
 * — never trust the client). Framework-free, so it stays importable from both.
 *
 * Numeric and date fields are authored as strings — that's what the form controls
 * emit — and transformed on parse, so the schema's *output* matches `NewPromoCode`:
 * `z.input` is the form's value type, `z.output` the payload the use-case receives.
 *
 * Validation messages are `formErrors` message keys, translated at display time
 * (see `src/lib/formErrorMessage.ts`).
 */

/** `YYYY-MM-DD`, the value an `<input type="date">` emits. */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * A code is letters, digits, dashes and underscores — the character set that
 * survives being read off a card, typed on a phone keyboard and pasted into a
 * cart field. Case is normalized to upper by the use-case.
 */
const CODE_PATTERN = /^[A-Za-z0-9_-]+$/;

/**
 * The campaign start an operator picked, as the instant it opens: midnight UTC on
 * that date. Blank means "already open" — the code works from the moment it exists.
 *
 * UTC rather than store-local because every other date in the system is UTC
 * (the delivery horizon, the order timestamps, the slot calendar dates), and a
 * campaign boundary that drifted against the delivery calendar would be a bug
 * nobody would look for here.
 */
function startDateToIso(date: string | undefined): string | undefined {
  if (!date) return undefined;
  return new Date(`${date}T00:00:00Z`).toISOString();
}

/**
 * The campaign end an operator picked, as the instant it *closes*.
 *
 * The form's end date is inclusive — "runs through Jul 31" is what an operator
 * means when they pick Jul 31, and it's what the table shows back to them. The
 * domain's `endsAt` is exclusive (`isPromoLive` treats reaching it as over), so
 * the stored instant is midnight UTC on the *following* day. The whole of the
 * chosen day is live, which is the only reading that isn't a surprise.
 *
 * {@link isoToEndDate} is the exact inverse, and is what refills the edit form —
 * the two must always be changed together.
 */
export function endDateToIso(date: string | undefined): string | undefined {
  if (!date) return undefined;
  return new Date(new Date(`${date}T00:00:00Z`).getTime() + DAY_MS).toISOString();
}

/** Inverse of {@link endDateToIso}: the stored exclusive instant back to the inclusive date shown in the form. */
export function isoToEndDate(iso: string | undefined): string {
  if (!iso) return "";
  return new Date(new Date(iso).getTime() - DAY_MS).toISOString().slice(0, 10);
}

/** The stored start instant back to the `YYYY-MM-DD` the date input wants. */
export function isoToStartDate(iso: string | undefined): string {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

/** Optional date: blank → `undefined`; otherwise must be a real `YYYY-MM-DD`. */
const optionalDateField = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined))
  .refine(
    (value) => value === undefined || (DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))),
    "dateInvalid",
  );

/** Required discount: the string the form emits, validated as a whole 1–100 percentage. */
const discountField = z
  .string()
  .trim()
  .min(1, "discountRequired")
  .regex(/^\d+$/, "discountWhole")
  .transform(Number)
  .refine((n) => n >= 1 && n <= 100, "discountRange");

export const promoCodeFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, "codeRequired")
      .max(32, "codeTooLong")
      .regex(CODE_PATTERN, "codeFormat"),
    title: z.string().trim().min(1, "titleRequired").max(60, "titleTooLong"),
    description: z.string().trim().min(1, "descriptionRequired").max(160, "descriptionTooLong"),
    discountPercent: discountField,
    /** Whether the campaign is switched on. Off is how a code is retired — codes are never deleted. */
    active: z.boolean(),
    /** Campaign start, inclusive. Blank → live immediately. */
    startsAt: optionalDateField,
    /** Campaign end, inclusive (see {@link endDateToIso}). Blank → open-ended. */
    endsAt: optionalDateField,
  })
  .refine((data) => !data.startsAt || !data.endsAt || data.endsAt >= data.startsAt, {
    path: ["endsAt"],
    // Compared as `YYYY-MM-DD` strings, which sort lexicographically the same way
    // they sort chronologically. `>=` because an equal pair is a valid one-day
    // campaign: it opens at that day's midnight and closes at the next.
    message: "endBeforeStart",
  })
  .transform((data) => ({
    code: data.code,
    title: data.title,
    description: data.description,
    discountPercent: data.discountPercent,
    active: data.active,
    startsAt: startDateToIso(data.startsAt),
    endsAt: endDateToIso(data.endsAt),
  }));

/** Form value shape (what the controls hold, before transform). */
export type PromoCodeFormInput = z.input<typeof promoCodeFormSchema>;
/** Validated payload shape (what the use-case receives) — matches `NewPromoCode`. */
export type PromoCodeFormValues = z.output<typeof promoCodeFormSchema>;

/**
 * The body of the activate/deactivate toggle — a one-field PATCH, kept separate
 * from the full form so flipping the switch from the table never has to send (or
 * re-validate) a whole campaign it isn't touching.
 */
export const promoCodeActiveSchema = z.object({
  active: z.boolean(),
});

export type PromoCodeActiveInput = z.infer<typeof promoCodeActiveSchema>;
