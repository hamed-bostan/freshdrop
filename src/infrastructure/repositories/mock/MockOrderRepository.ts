import type {
  DeliveryType,
  ItemSubstitution,
  Order,
  OrderItem,
  OrderPhase,
  OrderStatus,
  PaymentStatus,
} from "@/src/domain/entities/Order";
import { pipelinePredicate } from "@/src/domain/entities/OrderPipelineStage";
import type { AdminOrderFilters, AdminOrderSort } from "@/src/domain/entities/AdminOrderFilters";
import { DEFAULT_ADMIN_ORDER_DIRECTION } from "@/src/domain/entities/AdminOrderFilters";
import { paginateArray, type Page, type PageRequest } from "@/src/domain/entities/Pagination";
import type { TrackingMilestone } from "@/src/domain/entities/OrderTracking";
import type {
  IOrderRepository,
  NewOrder,
  OrderStatusTransition,
  OrderTrackingUpdate,
} from "@/src/domain/repositories/IOrderRepository";
import type { IProductRepository } from "@/src/domain/repositories/IProductRepository";
import { NotFoundError } from "@/src/domain/errors/NotFoundError";

/** The seeded demo orders predate real accounts, so they belong to a sentinel owner. */
const DEMO_USER_ID = "demo";

/**
 * The editable surface of a seeded order: just the facts that differ. The item
 * snapshots (name, image) are resolved from the product catalog at build time —
 * the seed only references products by id and quantity.
 */
type OrderSeed = {
  id: string;
  /** The seed's human-facing number — assigned in placement order (oldest first), same as the real backfill. */
  orderNumber: number;
  status: OrderStatus;
  phase: OrderPhase;
  placedAt: string;
  location: string;
  /** Saved-address label the order card collapses the address to ("Home", "Gym"). */
  locationLabel: string;
  total: number;
  /**
   * How it's handed over and where its money stands. Both omitted on most seeds
   * and defaulted to the ordinary case (couriered, paid) — a seed only states
   * them when it exists to demonstrate the *unusual* case, so reading the list
   * shows at a glance which orders are the interesting ones.
   */
  deliveryType?: DeliveryType;
  paymentStatus?: PaymentStatus;
  /** Starting delivery milestone. Omitted for orders that aren't trackable. */
  stage?: TrackingMilestone;
  lines: { productId: string; quantity: number }[];
};

const ORDER_SEEDS: OrderSeed[] = [
  {
    id: "FD-10231",
    orderNumber: 1004,
    status: "completed",
    phase: "current",
    placedAt: "2023-10-09T15:22:00Z",
    location: "123 Maple Street, Toronto, ON M5H 2N2",
    locationLabel: "Home",
    total: 129.9,
    stage: "arrived",
    lines: [
      { productId: "10-1", quantity: 1 }, // Sourdough Loaf
      { productId: "2-1", quantity: 2 }, // Cage-Free Eggs
      { productId: "3-1", quantity: 1 }, // Norwegian Salmon Fillet
      { productId: "6-1", quantity: 3 }, // Bananas
      { productId: "11-1", quantity: 1 }, // Milk Chocolate Bar
    ],
  },
  {
    id: "FD-10219",
    orderNumber: 1003,
    status: "processing",
    phase: "current",
    placedAt: "2023-10-08T11:05:00Z",
    location: "123 Maple Street, Toronto, ON M5H 2N2",
    locationLabel: "Home",
    total: 86.4,
    stage: "shipped",
    lines: [
      { productId: "1-1", quantity: 2 }, // Organic Baby Spinach
      { productId: "5-1", quantity: 4 }, // Sparkling Spring Water
      { productId: "2-3", quantity: 1 }, // Whole Milk
      { productId: "6-2", quantity: 1 }, // Royal Gala Apples
      { productId: "9-1", quantity: 2 }, // Durum Wheat Spaghetti
    ],
  },
  {
    id: "FD-09984",
    orderNumber: 1002,
    status: "completed",
    phase: "previous",
    placedAt: "2023-09-21T18:40:00Z",
    location: "78 King St, Toronto, ON, Canada",
    locationLabel: "Office",
    total: 54.25,
    lines: [
      { productId: "3-2", quantity: 1 }, // Chicken Breast Fillets
      { productId: "8-1", quantity: 2 }, // Tomato Pasta Sauce
      { productId: "9-2", quantity: 1 }, // Whole Wheat Spaghetti
      { productId: "14-1", quantity: 1 }, // Earl Grey Tea
      { productId: "12-1", quantity: 2 }, // Strawberry Jam
    ],
  },
  {
    id: "FD-09870",
    orderNumber: 1001,
    status: "cancelled",
    phase: "previous",
    placedAt: "2023-09-03T09:15:00Z",
    location: "FitZone Gym, 250 Front St W, Toronto, ON",
    locationLabel: "Gym",
    total: 41.8,
    lines: [
      { productId: "13-1", quantity: 1 }, // Craft Lager 4-Pack
      { productId: "16-1", quantity: 3 }, // Rainbow Lollipops
      { productId: "11-3", quantity: 1 }, // Caramel Fudge
      { productId: "5-2", quantity: 2 }, // Fresh Orange Juice
      { productId: "10-3", quantity: 1 }, // Butter Croissants
    ],
  },
];

/**
 * Resolves seeded orders against the product catalog. Depends on the product
 * repository (not the catalog directly) so orders stay decoupled from how
 * products are stored — Dependency Inversion, same as the composition root.
 *
 * Delivery stage lives in a mutable in-memory map seeded from `ORDER_SEEDS`. As
 * the container binds this as a singleton, dashboard stage changes persist for
 * the life of the server process — a stand-in for real persistence, mirroring
 * how `MockFavoriteRepository` keeps its toggles.
 */
export class MockOrderRepository implements IOrderRepository {
  // `null` is a distinct override meaning "stage explicitly cleared" (e.g. a
  // cancelled order); an absent key falls back to the seed/runtime stage.
  private readonly stages = new Map<string, TrackingMilestone | null>(
    ORDER_SEEDS.flatMap((seed) => (seed.stage ? [[seed.id, seed.stage] as const] : [])),
  );
  private readonly statuses = new Map<string, OrderStatus>(
    ORDER_SEEDS.map((seed) => [seed.id, seed.status] as const),
  );
  /** Phase overrides written by lifecycle transitions (cancel/refund archive the order). */
  private readonly phases = new Map<string, OrderPhase>();
  /** Payment-status overrides written by lifecycle transitions (a refund moves it to `refunded`). */
  private readonly paymentStatuses = new Map<string, PaymentStatus>();
  /** Picker substitution resolutions, keyed `${orderId}::${productId}`. */
  private readonly substitutions = new Map<string, ItemSubstitution>();
  /** Orders placed at runtime (via checkout), newest appended last. */
  private readonly created: Order[] = [];
  private nextId = 1;
  /** Continues the seeds' numbering (highest seeded is 1004) for runtime-created orders. */
  private nextOrderNumber = 1005;

  constructor(private readonly products: IProductRepository) {}

  async getOrders(userId: string): Promise<Order[]> {
    return (await this.getAllOrders()).filter((order) => order.userId === userId);
  }

  async listPage(filters: AdminOrderFilters, page: PageRequest<AdminOrderSort>): Promise<Page<Order>> {
    // Mirrors `toOrderWhere` in the Prisma repo, predicate for predicate: an id
    // substring (case-insensitive), the pipeline stage's (status, stage) pair,
    // exact delivery/payment, and inclusive date and total bounds — all AND-ed,
    // so an empty filter matches every order.
    const needle = filters.query?.toLowerCase() ?? "";
    const needleAsOrderNumber = Number.parseInt(needle.replace(/^#/, ""), 10);
    const customerIds = filters.userIds?.length ? new Set(filters.userIds) : null;
    const matched = (await this.getAllOrders()).filter((order) => {
      // Id, order number, *or* customer — see the OR-group in `toOrderWhere`.
      if (
        needle &&
        !order.id.toLowerCase().includes(needle) &&
        order.orderNumber !== needleAsOrderNumber &&
        !customerIds?.has(order.userId)
      ) {
        return false;
      }

      if (filters.pipeline) {
        const predicate = pipelinePredicate(filters.pipeline);
        if (order.status !== predicate.status) return false;
        // `null` means "no stage set"; `undefined` means the stage is unconstrained.
        if (predicate.stage !== undefined && (order.stage ?? null) !== predicate.stage) return false;
      }

      if (filters.deliveryType && order.deliveryType !== filters.deliveryType) return false;
      if (filters.paymentStatus && order.paymentStatus !== filters.paymentStatus) return false;

      // Compared as instants, not strings: the seeds are written without
      // milliseconds and the filters arrive from `toISOString()` with them, and
      // lexicographic order disagrees with chronological order across the two
      // spellings of the same moment.
      const placedAt = Date.parse(order.placedAt);
      if (filters.placedFrom && placedAt < Date.parse(filters.placedFrom)) return false;
      if (filters.placedTo && placedAt > Date.parse(filters.placedTo)) return false;
      if (filters.minTotal != null && order.total < filters.minTotal) return false;
      if (filters.maxTotal != null && order.total > filters.maxTotal) return false;

      return true;
    });

    const sign = (page.direction ?? DEFAULT_ADMIN_ORDER_DIRECTION) === "asc" ? 1 : -1;
    const sorted = [...matched].sort((a, b) =>
      page.sort === "total"
        ? sign * (a.total - b.total)
        : sign * (new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime()),
    );

    return paginateArray(sorted, page);
  }

  async getAllOrders(): Promise<Order[]> {
    const all = await this.products.getAll();
    const byId = new Map(all.map((product) => [product.id, product]));

    const seeded: Order[] = ORDER_SEEDS.map((seed) => {
      const items: OrderItem[] = seed.lines
        .map(({ productId, quantity }) => {
          const product = byId.get(productId);
          if (!product) return null;
          return this.withSubstitution(seed.id, {
            productId,
            name: product.name,
            imageUrl: product.imageUrl,
            quantity,
            price: product.price,
            substitutionPreference: "substitute",
          });
        })
        .filter((item): item is OrderItem => item != null);

      return {
        id: seed.id,
        orderNumber: seed.orderNumber,
        userId: DEMO_USER_ID,
        status: this.statuses.get(seed.id) ?? seed.status,
        phase: this.phases.get(seed.id) ?? seed.phase,
        deliveryType: seed.deliveryType ?? "delivery",
        paymentStatus: this.paymentStatuses.get(seed.id) ?? seed.paymentStatus ?? "paid",
        placedAt: seed.placedAt,
        location: seed.location,
        locationLabel: seed.locationLabel,
        // Demo orders carry no promo/shipping breakdown — treat the total as pure
        // merchandise (no discount to pro-rate), enough for the mock.
        subtotal: seed.total,
        shipping: 0,
        discount: 0,
        total: seed.total,
        stage: this.stages.get(seed.id) ?? undefined,
        items,
      };
    });

    // Runtime orders honour the same status/phase/stage/payment overrides as the
    // seeds. `stages.has` distinguishes a cleared stage (mapped to null) from no
    // override.
    const runtime: Order[] = this.created.map((order) => ({
      ...order,
      status: this.statuses.get(order.id) ?? order.status,
      phase: this.phases.get(order.id) ?? order.phase,
      paymentStatus: this.paymentStatuses.get(order.id) ?? order.paymentStatus,
      stage: this.stages.has(order.id) ? (this.stages.get(order.id) ?? undefined) : order.stage,
      items: order.items.map((item) => this.withSubstitution(order.id, item)),
    }));

    // Newest first — runtime orders carry the latest timestamps.
    return [...seeded, ...runtime].sort((a, b) => b.placedAt.localeCompare(a.placedAt));
  }

  async getById(orderId: string): Promise<Order | null> {
    return (await this.getAllOrders()).find((order) => order.id === orderId) ?? null;
  }

  async createOrder(input: NewOrder): Promise<Order> {
    // Honour a caller-minted id (checkout mints one so its stock movements can
    // name the order); fall back to the mock's own sequence otherwise. The order
    // number is always assigned here — nothing ever supplies one, same as the
    // real DB's autoincrement default.
    const order: Order = {
      ...input,
      id: input.id ?? `FD-${String(this.nextId++).padStart(5, "0")}`,
      orderNumber: this.nextOrderNumber++,
    };
    this.created.push(order);
    return order;
  }

  async setTrackingStage(orderId: string, update: OrderTrackingUpdate): Promise<Order> {
    if (!(await this.getById(orderId))) throw new NotFoundError("order", orderId);

    this.stages.set(orderId, update.stage);
    this.statuses.set(orderId, update.status);

    const order = await this.getById(orderId);
    // Unreachable — existence was just checked — but keeps the return type honest.
    if (!order) throw new NotFoundError("order", orderId);
    return order;
  }

  async transitionStatus(orderId: string, transition: OrderStatusTransition): Promise<Order | null> {
    const { from, to } = transition;

    const order = await this.getById(orderId);
    // Precondition check (single-threaded JS makes this read-then-write atomic):
    // the transition only lands when the order is still in the expected state.
    if (!order) return null;
    if (order.status !== from.status) return null;
    if (from.stage !== undefined && order.stage !== from.stage) return null;

    this.statuses.set(orderId, to.status);
    if (to.phase !== undefined) this.phases.set(orderId, to.phase);
    // `null` clears the stage; `undefined` leaves the existing override untouched.
    if (to.stage !== undefined) this.stages.set(orderId, to.stage);
    if (to.paymentStatus !== undefined) this.paymentStatuses.set(orderId, to.paymentStatus);

    return this.getById(orderId);
  }

  async resolveItemSubstitution(
    orderId: string,
    productId: string,
    resolution: ItemSubstitution,
  ): Promise<Order | null> {
    const key = `${orderId}::${productId}`;
    const order = await this.getById(orderId);
    // Guard mirrors the Prisma `updateMany` precondition: only an existing,
    // still-unresolved line can be resolved (single-threaded JS makes this atomic).
    if (!order) return null;
    const item = order.items.find((line) => line.productId === productId);
    if (!item || item.substitution) return null;

    this.substitutions.set(key, resolution);
    return this.getById(orderId);
  }

  /** Overlay any recorded picker resolution onto a line as it's read back. */
  private withSubstitution(orderId: string, item: OrderItem): OrderItem {
    const substitution = this.substitutions.get(`${orderId}::${item.productId}`);
    return substitution ? { ...item, substitution } : item;
  }
}
