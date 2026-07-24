import type { ActivityActor } from "../../entities/ActivityEntry";
import { priceCart, type CartItem } from "../../entities/Cart";
import type { DeliveryType, Order, PaymentStatus } from "../../entities/Order";
import type { IDeliverySlotRepository } from "../../repositories/IDeliverySlotRepository";
import type { IOrderNotifier } from "../../repositories/IOrderNotifier";
import type { IProductRepository } from "../../repositories/IProductRepository";
import type { IUnitOfWork } from "../../repositories/IUnitOfWork";
import type { IUserRepository } from "../../repositories/IUserRepository";
import { NotFoundError } from "../../errors/NotFoundError";
import { ValidationError } from "../../errors/ValidationError";
import { placeOrder } from "./placeOrder";

export type PlaceOrderForCustomerInput = {
  /** The customer the order is for. Must already exist — this does not create people. */
  userId: string;
  /** What they're buying. Priced from the catalog here; the caller sends no amounts. */
  lines: { productId: string; quantity: number }[];
  /** Where it's going, as typed by whoever took the call. */
  location: string;
  deliveryDate: string;
  deliveryWindowId: string;
  deliveryType: DeliveryType;
  /**
   * Where the money stands. Unlike checkout — which can only record a settled
   * charge, because it runs after one — a phone order is commonly taken before
   * payment, and saying so is the point of the field.
   */
  paymentStatus: PaymentStatus;
};

/** How many distinct lines one manually-entered order may carry. */
const MAX_LINES = 50;

/**
 * Place an order on a customer's behalf — the dashboard's "create order", for the
 * order that arrives by phone.
 *
 * Shares {@link placeOrder} with checkout, so a phone order claims stock, books
 * its slot and is recorded exactly as a shopper's order is. What it deliberately
 * does *not* share is checkout's surroundings: it never touches the customer's
 * cart (that's their session, mid-shop, and emptying it because someone rang the
 * shop would be indefensible), and it counts no promo redemption, because an
 * admin has no promo to apply here.
 *
 * Prices come from the catalog, read here. The request carries product ids and
 * quantities and no amounts at all — not because an admin is untrusted, but
 * because a price typed by hand is a price that disagrees with the catalog, and
 * every downstream number (the refund on a substituted line, the revenue figure)
 * is computed from what the order says it charged.
 *
 * The customer is told, on the same terms as checkout: they didn't press the
 * button, so an order appearing in their history unannounced is worse here than
 * it would be there, not better.
 */
export class PlaceOrderForCustomer {
  constructor(
    private readonly uow: IUnitOfWork,
    private readonly products: IProductRepository,
    private readonly users: IUserRepository,
    private readonly slotRepo: IDeliverySlotRepository,
    private readonly notifier: IOrderNotifier,
  ) {}

  async execute(input: PlaceOrderForCustomerInput, actor: ActivityActor): Promise<Order> {
    const { userId, lines, location, ...placement } = input;

    if (lines.length === 0) throw new ValidationError("lines", "Add at least one product.");
    if (lines.length > MAX_LINES) {
      throw new ValidationError("lines", `An order can hold at most ${MAX_LINES} products.`);
    }
    if (!location.trim()) throw new ValidationError("location", "Enter a delivery address.");

    // The customer has to exist before an order is attributed to them. Orders
    // reference a user with no DB foreign key, so nothing downstream would catch
    // a typo'd id — it would simply become an order nobody owns.
    const customer = await this.users.getById(userId);
    if (!customer) throw new NotFoundError("user", userId);

    const items: CartItem[] = [];
    for (const line of lines) {
      if (!Number.isInteger(line.quantity) || line.quantity < 1) {
        throw new ValidationError("lines", "Each product needs a whole quantity of at least 1.");
      }
      const product = await this.products.getById(line.productId);
      if (!product) throw new NotFoundError("product", line.productId);
      items.push({ product, quantity: line.quantity });
    }

    // Priced by the same rule as the shopper's cart. No promo: an admin has no
    // code to apply, and a discount typed in by hand is a different feature.
    const cart = priceCart(items, null);

    const order = await placeOrder(
      { uow: this.uow, slotRepo: this.slotRepo },
      {
        ...placement,
        userId,
        location: location.trim(),
        cart,
        // Who entered it, written in the same transaction as the order — the log's
        // standing rule for a change to something stored. An order appearing in a
        // customer's history without them placing it is exactly the thing someone
        // has to account for later, and the order row itself carries no trace of
        // the admin by design.
        audit: (saved) => ({
          actorId: actor.id,
          actorName: actor.name,
          action: "order.created",
          entityType: "order",
          entityId: saved.id,
          entityLabel: saved.id,
          // No diff: nothing changed *from* anything. The entry's job here is to
          // name who created it, which the actor fields already do.
          changes: [],
        }),
      },
    );

    // Best-effort, as at checkout: the order is recorded, and the notifier swallows
    // a delivery failure itself.
    await this.notifier.orderConfirmed(order);

    return order;
  }
}
