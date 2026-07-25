import type { Refund } from "../entities/Refund";

/** A refund about to be written. The id and timestamp are the repository's to assign. */
export type NewRefund = Omit<Refund, "id" | "createdAt">;

/**
 * The refund ledger. Deliberately two methods and no update, no delete — a
 * refund is a record of money that moved, and one that could be revised
 * afterwards isn't a record. The same reasoning `IOrderNoteRepository` and
 * `IActivityLog` are built on.
 */
export type IRefundRepository = {
  /** One order's refunds, oldest first — the order they were issued in. */
  listForOrder(orderId: string): Promise<Refund[]>;
  /** Append a refund (with its lines), returning it with its assigned id and timestamp. */
  record(refund: NewRefund): Promise<Refund>;
};
