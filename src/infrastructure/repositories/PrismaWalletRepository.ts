import type { CardBrand, SavedCard, TransactionType, Wallet } from "@/src/domain/entities/Wallet";
import {
  describeTransaction,
  type WalletTransactionReason,
} from "@/src/domain/entities/WalletTransactionDescription";
import type { IWalletRepository } from "@/src/domain/repositories/IWalletRepository";
import { prisma } from "@/src/infrastructure/prisma/client";
import { inTransaction, type PrismaDb } from "@/src/infrastructure/prisma/transaction";

/**
 * A user's wallet backed by PostgreSQL via Prisma. The aggregate is assembled from
 * three tables (account balance, saved cards, transactions); a user with no rows
 * yet reads as an empty $0 wallet rather than an error. Server-side only — bound
 * through the container, never imported by client code.
 */
export class PrismaWalletRepository implements IWalletRepository {
  /**
   * The root client normally, a transaction client when a unit of work handed this
   * repository out — see `PrismaUnitOfWork`. This is what lets a refund credit the
   * wallet in the same transaction that cancels the order it refunds.
   */
  constructor(private readonly db: PrismaDb = prisma) {}

  async getWallet(userId: string): Promise<Wallet> {
    const [account, cards, transactions] = await Promise.all([
      this.db.walletAccount.findUnique({ where: { userId } }),
      this.listCards(userId),
      this.db.walletTransaction.findMany({
        where: { userId },
        // Most recent first; the synthetic id breaks ties deterministically.
        orderBy: [{ date: "desc" }, { id: "asc" }],
      }),
    ]);

    return {
      balance: account?.balance ?? 0,
      cards,
      transactions: transactions.map((row) => ({
        id: row.id,
        description: row.description,
        reason: row.reason,
        reasonItem: row.reasonItem,
        date: row.date.toISOString(),
        amount: row.amount,
        type: row.type as TransactionType,
      })),
    };
  }

  async listCards(userId: string): Promise<SavedCard[]> {
    const rows = await this.db.walletCard.findMany({
      where: { userId },
      // Insertion order (with a deterministic tiebreak) so the carousel stays stable.
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    return rows.map((row) => ({
      id: row.id,
      brand: row.brand as CardBrand,
      holderName: row.holderName,
      number: row.number,
      expiry: row.expiry,
    }));
  }

  async addCard(userId: string, card: Omit<SavedCard, "id">): Promise<SavedCard> {
    const row = await this.db.walletCard.create({
      data: { userId, brand: card.brand, holderName: card.holderName, number: card.number, expiry: card.expiry },
    });
    return {
      id: row.id,
      brand: row.brand as CardBrand,
      holderName: row.holderName,
      number: row.number,
      expiry: row.expiry,
    };
  }

  async addFunds(
    userId: string,
    amount: number,
    reason: WalletTransactionReason = { kind: "addedToWallet" },
  ): Promise<void> {
    // Balance change and its transaction are written together so the two never
    // drift; the account row is created on first top-up (upsert). The row stores
    // the machine reason plus the English description snapshot derived from it.
    await inTransaction(this.db, async (tx) => {
      await tx.walletAccount.upsert({
        where: { userId },
        create: { userId, balance: amount },
        update: { balance: { increment: amount } },
      });
      await tx.walletTransaction.create({
        data: {
          userId,
          description: describeTransaction(reason),
          reason: reason.kind,
          reasonItem: "item" in reason ? reason.item : null,
          amount,
          type: "credit",
          date: new Date(),
        },
      });
    });
  }
}
