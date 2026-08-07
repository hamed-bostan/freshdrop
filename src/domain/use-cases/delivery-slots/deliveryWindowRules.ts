import { ValidationError } from "../../errors/ValidationError";

import type { DeliveryWindowInput } from "../../repositories/IDeliverySlotRepository";

/**
 * The delivery-window invariants, shared by create and update so the two can't
 * drift apart. The API routes re-validate submissions with the Zod contract
 * (`src/contracts/delivery-window-schema.ts`) — that's the input boundary; these
 * are the domain's own guarantees, enforced for every caller.
 */

/** Minutes in a day — the exclusive ceiling on a window's end. */
export const MINUTES_IN_DAY = 24 * 60;

/**
 * A window id is a stable human slug ("morning", "late-evening"): it's referenced
 * by the booking ledger and by every order that books the window, and it shows up
 * in URLs. Same shape as a category slug.
 */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Throw a `ValidationError` naming the offending field, or return. */
export function assertValidDeliveryWindow(input: DeliveryWindowInput): void {
  if (!input.label.trim()) throw new ValidationError("label", "A label is required.");

  for (const [field, value] of [
    ["startMinutes", input.startMinutes],
    ["endMinutes", input.endMinutes],
  ] as const) {
    if (!Number.isInteger(value) || value < 0 || value > MINUTES_IN_DAY) {
      throw new ValidationError(field, "Enter a time within the day.");
    }
  }

  // A window that ends before it starts (or is instantaneous) can never be booked,
  // and the same-day cutoff check would compare against a start that never arrives.
  if (input.endMinutes <= input.startMinutes) {
    throw new ValidationError("endMinutes", "The end time must be after the start time.");
  }

  // Capacity 0 is a window nobody can book — that's what removing it (or reducing
  // it out of the horizon) is for, and a zero-capacity window would render as
  // permanently "Full" at checkout with no explanation.
  if (!Number.isInteger(input.capacity) || input.capacity < 1) {
    throw new ValidationError("capacity", "Capacity must be at least 1.");
  }

  if (!Number.isInteger(input.position) || input.position < 0) {
    throw new ValidationError("position", "Enter a whole position (0 or more).");
  }
}

/** Validate an operator-authored window slug (creation only — the id is immutable after that). */
export function assertValidWindowId(id: string): void {
  if (!id) throw new ValidationError("id", "An id is required.");
  if (!SLUG_PATTERN.test(id)) {
    throw new ValidationError("id", "Use lowercase letters, numbers and hyphens only.");
  }
}
