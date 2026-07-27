import { activityValue } from "../../entities/ActivityEntry";
import type { Product } from "../../entities/Product";
import type { AdminStockMovementReason } from "../../entities/StockMovement";
import { isAdminStockMovementReason } from "../../entities/StockMovement";
import type { IProductRepository } from "../../repositories/IProductRepository";
import type { IStockAlertRepository } from "../../repositories/IStockAlertRepository";
import type { IStockAlertNotifier } from "../../repositories/IStockAlertNotifier";
import type { IUserRepository } from "../../repositories/IUserRepository";
import type { IAdminNotificationRepository } from "../../repositories/IAdminNotificationRepository";
import type { IEmailSender } from "../../repositories/IEmailSender";
import type { INotificationTemplateRepository } from "../../repositories/INotificationTemplateRepository";
import { ValidationError } from "../../errors/ValidationError";
import { NotFoundError } from "../../errors/NotFoundError";
import { FulfillStockAlerts } from "./FulfillStockAlerts";
import { NotifyAdmins } from "../notifications/NotifyAdmins";

export type AdjustStockInput = {
  productId: string;
  /** Signed change in units: positive onto the shelf, negative off it. Never 0. */
  delta: number;
  reason: AdminStockMovementReason;
  /** Optional free-text detail ("two crates damaged in transit"). */
  note?: string;
  /** The admin making the adjustment; resolved to a name for the ledger entry. */
  actorId: string;
};

/** Shown in the ledger when the actor's user row can't be read. */
const UNKNOWN_ACTOR_NAME = "Unknown";

/**
 * Move one product's stock by a signed delta, recording why and who.
 *
 * The narrow counterpart to `UpdateProduct`: restocking from the catalog list
 * shouldn't mean sending — or re-validating — an entire product that isn't being
 * touched, and shouldn't risk clobbering a field someone else edited in between.
 * The repository applies the delta and writes the ledger entry as one atomic
 * operation, so there is no window in which stock moved without a reason attached.
 *
 * The actor's *name* is snapshotted into the entry here rather than joined at read
 * time, the same treatment the role-change log gives its actors: the history has
 * to stay truthful after a rename, and survive the account being removed.
 */
export class AdjustStock {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly users: IUserRepository,
    private readonly stockAlerts: IStockAlertRepository,
    private readonly notifier: IStockAlertNotifier,
    private readonly adminNotifications: IAdminNotificationRepository,
    private readonly emailSender: IEmailSender,
    private readonly templateRepo: INotificationTemplateRepository,
  ) {}

  async execute({ productId, delta, reason, note, actorId }: AdjustStockInput): Promise<Product> {
    if (!productId) throw new ValidationError("productId", "Missing product id.");
    if (!Number.isInteger(delta)) {
      throw new ValidationError("delta", "Adjust by a whole number of units.");
    }
    if (delta === 0) {
      throw new ValidationError("delta", "Enter how many units to add or remove.");
    }
    // Defence in depth behind the schema's enum: `sale` is written by checkout and
    // nowhere else, so an operator must never be able to enter one by hand — that
    // would put a sale that never happened into the ledger the revenue side reads.
    if (!isAdminStockMovementReason(reason)) {
      throw new ValidationError("reason", "Choose a reason for the adjustment.");
    }

    const existing = await this.productRepo.getById(productId);
    if (!existing) throw new NotFoundError("product", productId);

    const actor = await this.users.getById(actorId);
    const actorName = actor?.name ?? UNKNOWN_ACTOR_NAME;
    // Recorded here *as well as* in the stock ledger, which is not duplication for
    // its own sake: the ledger is the running account of one product's quantity,
    // read to reconcile a level; this is the cross-entity trail read to answer
    // "what did this person change on Tuesday". Neither answers the other's
    // question, and the alternative — making the activity page join a ledger keyed
    // by product — would leave stock the one admin action you can't see alongside
    // the rest. The reason and note ride along so the entry stands alone.
    //
    // All three writes — the level, the ledger entry and this — are one
    // transaction, so the two histories of the same movement can never disagree
    // about whether it happened.
    const adjusted = await this.productRepo.adjustStock(
      productId,
      delta,
      { reason, note, actor: { id: actorId, name: actorName } },
      (product) => ({
        actorId,
        actorName,
        action: "product.stockAdjusted",
        entityType: "product",
        entityId: product.id,
        entityLabel: product.name,
        changes: [
          {
            field: "stockQuantity",
            before: activityValue(existing.stockQuantity),
            after: activityValue(product.stockQuantity),
          },
          { field: "reason", before: null, after: activityValue(reason) },
          ...(note ? [{ field: "note", before: null, after: activityValue(note) }] : []),
        ],
      }),
    );

    // Crossing back above zero fulfils any back-in-stock alerts — the same rule
    // the full edit form applies, which is why both share `FulfillStockAlerts`.
    if (existing.stockQuantity <= 0 && adjusted.stockQuantity > 0) {
      await new FulfillStockAlerts(this.stockAlerts, this.notifier).execute(adjusted);
    }

    // The inverse crossing — tell whoever restocks. `excludeUserId` drops the
    // acting admin: they just did this, they don't need telling. Best-effort,
    // like the fulfilment above: the adjustment already stands either way.
    if (existing.stockQuantity > 0 && adjusted.stockQuantity <= 0) {
      await new NotifyAdmins(this.users, this.adminNotifications, this.emailSender, this.templateRepo).execute(
        "catalog.write",
        {
          action: "product.stockDepleted",
          entityType: "product",
          entityId: adjusted.id,
          entityLabel: adjusted.name,
          actorId,
          actorName,
        },
        actorId,
      );
    }

    return adjusted;
  }
}
