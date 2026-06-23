import type { Order, OrderItem, OrderPhase, OrderStatus } from "@/src/domain/entities/Order";
import type { IOrderRepository } from "@/src/domain/repositories/IOrderRepository";
import type { IProductRepository } from "@/src/domain/repositories/IProductRepository";

/**
 * The editable surface of a seeded order: just the facts that differ. The item
 * snapshots (name, image) are resolved from the product catalog at build time —
 * the seed only references products by id and quantity.
 */
type OrderSeed = {
  id: string;
  status: OrderStatus;
  phase: OrderPhase;
  placedAt: string;
  location: string;
  total: number;
  lines: { productId: string; quantity: number }[];
};

const ORDER_SEEDS: OrderSeed[] = [
  {
    id: "FD-10231",
    status: "completed",
    phase: "current",
    placedAt: "2023-10-09T15:22:00Z",
    location: "Toronto, 23rd Street, No. 5",
    total: 129.9,
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
    status: "processing",
    phase: "current",
    placedAt: "2023-10-08T11:05:00Z",
    location: "Toronto, 23rd Street, No. 5",
    total: 86.4,
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
    status: "completed",
    phase: "previous",
    placedAt: "2023-09-21T18:40:00Z",
    location: "Toronto, 23rd Street, No. 5",
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
    status: "cancelled",
    phase: "previous",
    placedAt: "2023-09-03T09:15:00Z",
    location: "Toronto, 23rd Street, No. 5",
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
 */
export class MockOrderRepository implements IOrderRepository {
  constructor(private readonly products: IProductRepository) {}

  async getOrders(): Promise<Order[]> {
    const all = await this.products.getAll();
    const byId = new Map(all.map((product) => [product.id, product]));

    return ORDER_SEEDS.map((seed) => {
      const items: OrderItem[] = seed.lines
        .map(({ productId, quantity }) => {
          const product = byId.get(productId);
          if (!product) return null;
          return { productId, name: product.name, imageUrl: product.imageUrl, quantity };
        })
        .filter((item): item is OrderItem => item != null);

      return {
        id: seed.id,
        status: seed.status,
        phase: seed.phase,
        placedAt: seed.placedAt,
        location: seed.location,
        total: seed.total,
        items,
      };
    });
  }
}
