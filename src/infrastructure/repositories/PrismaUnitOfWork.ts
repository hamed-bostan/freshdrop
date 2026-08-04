import type { IUnitOfWork, TransactionalRepositories } from "@/src/domain/repositories/IUnitOfWork";
import { prisma } from "@/src/infrastructure/prisma/client";
import { PrismaDeliverySlotRepository } from "./PrismaDeliverySlotRepository";
import { PrismaOrderRepository } from "./PrismaOrderRepository";
import { PrismaProductRepository } from "./PrismaProductRepository";
import { PrismaRefundRepository } from "./PrismaRefundRepository";
import { PrismaReturnRepository } from "./PrismaReturnRepository";
import { PrismaWalletRepository } from "./PrismaWalletRepository";

/**
 * A unit of work over one Postgres transaction.
 *
 * Opens an interactive transaction and constructs a fresh repository per call,
 * each bound to that transaction's client. They're the same classes the container
 * binds normally — the only difference is which client they hold, which is why
 * every method already works unchanged inside one (see `inTransaction`).
 *
 * Constructed per `run` rather than held as fields: a repository bound to a
 * transaction is only valid for that transaction's lifetime, and one kept on the
 * instance would outlive it and quietly start issuing statements against a
 * finished transaction.
 *
 * The default timeout is Prisma's (5s). That's deliberate rather than raised: the
 * work inside is a handful of indexed writes, and if one of these transactions is
 * running long the right answer is to find out why, not to hold row locks on
 * `orders` and `wallet_accounts` for longer.
 */
export class PrismaUnitOfWork implements IUnitOfWork {
  run<T>(work: (repos: TransactionalRepositories) => Promise<T>): Promise<T> {
    return prisma.$transaction((tx) =>
      work({
        orders: new PrismaOrderRepository(tx),
        products: new PrismaProductRepository(tx),
        wallets: new PrismaWalletRepository(tx),
        slots: new PrismaDeliverySlotRepository(tx),
        refunds: new PrismaRefundRepository(tx),
        returns: new PrismaReturnRepository(tx),
      } satisfies TransactionalRepositories),
    );
  }
}
