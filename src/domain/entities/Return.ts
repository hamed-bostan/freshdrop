/**
 * The lifecycle of a `ReturnRequest`. Declared as an array with the union
 * derived from it, the same pattern `ORDER_STATUSES` uses, so the values exist
 * at runtime too (narrowing a row read back from Postgres).
 *
 * - `requested` — the customer opened it; nothing physical has happened yet.
 * - `in_transit` / `received` — modelled for a future courier-pickup flow;
 *   nothing in this phase writes them.
 * - `inspected` — an admin recorded each item's condition and recovery
 *   decision (see `RecordReturnInspection`). Optional: `ResolveOrderReturn`
 *   doesn't require it, it just restocks nothing for an item that skipped it.
 * - `resolved` / `rejected` — the admin's final ruling (see `ResolveOrderReturn`).
 */
export const RETURN_REQUEST_STATUSES = [
  "requested",
  "in_transit",
  "received",
  "inspected",
  "resolved",
  "rejected",
] as const;

export type ReturnRequestStatus = (typeof RETURN_REQUEST_STATUSES)[number];

/**
 * The physical state a returned unit came back in, recorded during inspection.
 */
export const RETURN_ITEM_CONDITIONS = [
  "unopened",
  "resellable",
  "damaged",
  "expired",
  "missing_parts",
] as const;

export type ReturnItemCondition = (typeof RETURN_ITEM_CONDITIONS)[number];

/**
 * What happened to a returned unit as a result of its condition — the
 * inspector's disposition. `pending` is a real, recorded decision (inspected,
 * but not yet actioned), distinct from the field being `undefined` (not
 * inspected at all).
 */
export const RETURN_RECOVERY_DECISIONS = [
  "restocked",
  "returned_to_supplier",
  "discounted",
  "disposed",
  "pending",
] as const;

export type ReturnRecoveryDecision = (typeof RETURN_RECOVERY_DECISIONS)[number];

/**
 * One line of a return request — a quantity of a single order item, and (once
 * inspected) what it came back as.
 */
export type ReturnItem = {
  id: string;
  orderItemId: string;
  productId: string;
  quantity: number;
  /** `undefined` until `RecordReturnInspection` sets it — not yet inspected. */
  condition?: ReturnItemCondition;
  /** `undefined` until `RecordReturnInspection` sets it — not yet inspected. */
  recoveryDecision?: ReturnRecoveryDecision;
  /**
   * What this line credits the customer — computed once at request time from
   * the order's pro-rata discount share (see `refundForLineValue`), not
   * recomputed later.
   */
  refundAmount: number;
  /** VAT portion of `refundAmount`. 0 when tax wasn't in effect for this order. */
  taxAmount: number;
};

/**
 * A customer's request to return part or all of a delivered order — the RMA.
 * More granular than `Order.status = "return_requested"`, which only says a
 * decision is pending: this is the record of which items, how many, why, and
 * (once inspected) what became of them.
 */
export type ReturnRequest = {
  id: string;
  /** A short sequential label for humans — support conversations, the admin queue. */
  rmaNumber: number;
  orderId: string;
  userId: string;
  status: ReturnRequestStatus;
  /** The customer's stated reason, if they gave one. */
  reason?: string;
  /** ISO 8601 timestamp (UTC). Formatted in the presentation layer. */
  requestedAt: string;
  receivedAt?: string;
  inspectedAt?: string;
  resolvedAt?: string;
  /** Who opened it — absent when the customer did (the normal case). */
  actorId?: string;
  actorName?: string;
  items: ReturnItem[];
};
