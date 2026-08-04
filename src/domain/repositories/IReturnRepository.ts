import type { ReturnItemCondition, ReturnRecoveryDecision, ReturnRequest } from "../entities/Return";
import type { AuditHook } from "./AuditHook";

/** One line about to be written alongside a new `ReturnRequest`. */
export type NewReturnItem = {
  orderItemId: string;
  productId: string;
  quantity: number;
  refundAmount: number;
  taxAmount: number;
};

/** A return request about to be written. The id, number and timestamps are the repository's to assign. */
export type NewReturnRequest = {
  orderId: string;
  userId: string;
  reason?: string;
  actorId?: string;
  actorName?: string;
  items: NewReturnItem[];
};

/** One item's inspection outcome, keyed by its `ReturnItem.id`. */
export type ReturnItemInspection = {
  returnItemId: string;
  condition: ReturnItemCondition;
  recoveryDecision: ReturnRecoveryDecision;
};

/**
 * The return/RMA ledger. `create` is called alongside the order's
 * `return_requested` transition (see `RequestOrderReturn`); `recordInspection`
 * and `resolve` both move an existing request along, so they take its id
 * rather than the order's — `getForOrder` is how a caller finds that id first.
 */
export type IReturnRepository = {
  /** The most recent return request opened on an order, or `null` if none was. */
  getForOrder(orderId: string): Promise<ReturnRequest | null>;
  /** Append a request (with its lines), returning it with assigned ids/numbers/timestamps. */
  create(request: NewReturnRequest, audit?: AuditHook<ReturnRequest>): Promise<ReturnRequest>;
  /**
   * Record each item's condition and recovery decision, stamping `inspectedAt`
   * and moving `status` to `inspected`.
   */
  recordInspection(
    returnRequestId: string,
    items: readonly ReturnItemInspection[],
    audit?: AuditHook<ReturnRequest>,
  ): Promise<ReturnRequest>;
  /** Stamp the admin's final ruling and `resolvedAt`. */
  resolve(
    returnRequestId: string,
    status: "resolved" | "rejected",
    audit?: AuditHook<ReturnRequest>,
  ): Promise<ReturnRequest>;
};
