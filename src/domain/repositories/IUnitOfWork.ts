import type { IDeliverySlotRepository } from "./IDeliverySlotRepository";
import type { IOrderRepository } from "./IOrderRepository";
import type { IProductRepository } from "./IProductRepository";
import type { IRefundRepository } from "./IRefundRepository";
import type { IReturnRepository } from "./IReturnRepository";
import type { IWalletRepository } from "./IWalletRepository";

/**
 * The repositories a unit of work hands to its callback, all bound to the same
 * transaction.
 *
 * Only the ones that participate in an operation claiming or releasing something
 * scarce — stock, delivery capacity, money — plus `refunds`, the ledger row that
 * makes a wallet credit auditable (see `Refund`), and `returns`, the RMA record
 * a return request/resolution commits alongside. This isn't a registry of
 * everything: a use-case that needs one repository should keep taking that
 * repository, because a unit of work is a claim about atomicity and asking for
 * one you don't need makes that claim where it isn't true.
 */
export type TransactionalRepositories = {
  orders: IOrderRepository;
  products: IProductRepository;
  wallets: IWalletRepository;
  slots: IDeliverySlotRepository;
  refunds: IRefundRepository;
  returns: IReturnRepository;
};

/**
 * Run several repositories' writes as one transaction.
 *
 * The problem it exists for: cancelling an order, approving a return and resolving
 * an out-of-stock line all do the same three things — move the order's state, put
 * stock back on the shelf, credit the customer's wallet — across three
 * repositories, and each of those was its own transaction. Every gap between them
 * was a way for the store to end up wrong in a way no retry fixes: an order
 * cancelled but not refunded, stock returned for a refund that never landed. The
 * guarded status transition made the *decision* exactly-once; it could do nothing
 * about the compensating writes that follow it.
 *
 * `run` gives the callback repositories bound to one transaction, so all of it
 * commits or none of it does. Throwing from the callback rolls the whole thing
 * back — which is how the "lost the race" paths bail out without having to undo
 * anything by hand.
 *
 * What must stay *outside* a unit of work: anything that isn't a database write.
 * Notifications and wallet-provider calls can't be rolled back, and holding a
 * transaction open across a network call to an SMS gateway is how a connection
 * pool dies. The use-cases return from `run` first and notify after.
 */
export type IUnitOfWork = {
  run<T>(work: (repos: TransactionalRepositories) => Promise<T>): Promise<T>;
};
