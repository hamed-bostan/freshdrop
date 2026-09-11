import { z } from "zod";

/**
 * The single source of truth for delivery-window form input, shared by the client
 * form (React Hook Form resolver) and the REST route handlers (defensive
 * re-validation — never trust the client). Framework-free, so it stays importable
 * from both.
 *
 * Times are authored as `HH:MM` (what an `<input type="time">` emits) and stored
 * as minutes from midnight, which is what the same-day cutoff check compares
 * against and what `formatWindowRange` renders from. The conversion lives here so
 * the form and the route can't disagree about it.
 *
 * Validation messages are `formErrors` message keys, translated at display time
 * (see `src/lib/formErrorMessage.ts`).
 */

/** `HH:MM`, 24-hour — the value an `<input type="time">` emits. */
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** `HH:MM` → minutes from midnight. */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** Minutes from midnight → `HH:MM`, to refill the time inputs from a stored window. */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

const timeField = z.string().trim().min(1, "timeRequired").regex(TIME_PATTERN, "timeInvalid");

/** Required whole number ≥ `min`: the string the form emits, validated and coerced. */
function wholeNumberField(min: number, requiredKey: string, rangeKey: string) {
  return z
    .string()
    .trim()
    .min(1, requiredKey)
    .regex(/^\d+$/, rangeKey)
    .transform(Number)
    .refine((n) => n >= min, rangeKey);
}

/** The fields an existing window can change — everything but its id. */
const deliveryWindowFields = {
  label: z.string().trim().min(1, "labelRequired").max(40, "labelTooLong"),
  startTime: timeField,
  endTime: timeField,
  capacity: wholeNumberField(1, "capacityRequired", "capacityMin"),
  position: wholeNumberField(0, "positionRequired", "positionWhole"),
};

/** End must be after start, or the window can never be booked. */
const endAfterStart = {
  path: ["endTime"],
  message: "endBeforeStart",
};

export const deliveryWindowFormSchema = z
  .object(deliveryWindowFields)
  // `HH:MM` strings sort lexicographically the way they sort chronologically.
  .refine((data) => data.endTime > data.startTime, endAfterStart)
  .transform(({ startTime, endTime, ...rest }) => ({
    ...rest,
    startMinutes: timeToMinutes(startTime),
    endMinutes: timeToMinutes(endTime),
  }));

/**
 * Creation additionally carries the window's id — a stable human slug ("morning")
 * that the booking ledger and every order that books this window reference. It's
 * authored once and immutable after that, which is why the edit schema above
 * doesn't include it.
 */
export const newDeliveryWindowSchema = z
  .object({
    id: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "slugRequired")
      .max(40, "slugTooLong")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slugFormat"),
    ...deliveryWindowFields,
  })
  .refine((data) => data.endTime > data.startTime, endAfterStart)
  .transform(({ startTime, endTime, ...rest }) => ({
    ...rest,
    startMinutes: timeToMinutes(startTime),
    endMinutes: timeToMinutes(endTime),
  }));

/** Form value shape for an edit (what the controls hold, before transform). */
export type DeliveryWindowFormInput = z.input<typeof deliveryWindowFormSchema>;
/** Validated edit payload — matches `DeliveryWindowInput`. */
export type DeliveryWindowFormValues = z.output<typeof deliveryWindowFormSchema>;

/** Form value shape for a creation — the edit fields plus the authored slug. */
export type NewDeliveryWindowFormInput = z.input<typeof newDeliveryWindowSchema>;
/** Validated creation payload — matches `DeliveryWindow`. */
export type NewDeliveryWindowFormValues = z.output<typeof newDeliveryWindowSchema>;
