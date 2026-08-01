/**
 * Idempotent development seed for the refunds & returns report.
 *
 * It owns only IDs prefixed with `demo-refund-report-`, so rerunning it never
 * mutates customer-created orders or ledger rows. Dates are relative to UTC
 * today, keeping both the current and comparison periods populated.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const PREFIX = "demo-refund-report-";
const DAY_MS = 86_400_000;

const cases = [
  { customer: "Sarah Johnson", product: "Tomato Pasta Sauce", image: "/images/onboarding-1.png", reason: "Damaged item", kind: "return", amount: 12.86, quantity: 2, daysAgo: 1 },
  { customer: "Michael Chen", product: "Single Malt Whisky", image: "/images/onboarding-2.png", reason: "Wrong item", kind: "return", amount: 84, quantity: 1, daysAgo: 2 },
  { customer: "Emily Brown", product: "Chicken Sausages", image: "/images/onboarding-3.png", reason: "Late delivery", kind: "manual", amount: 58.65, quantity: 3, daysAgo: 4 },
  { customer: "David Lee", product: "Chili Powder", image: "/images/onboarding-4.png", reason: "Changed mind", kind: "return", amount: 56.1, quantity: 2, daysAgo: 7 },
  { customer: "Priya Nair", product: "Herbal Chai Tea", image: "/images/order-confirmed.png", reason: "Missing item", kind: "substitution", amount: 32.31, quantity: 1, daysAgo: 10 },
  { customer: "Olivia Martin", product: "Extra Virgin Olive Oil", image: "/images/favorite-list.png", reason: "Damaged item", kind: "return", amount: 38.4, quantity: 2, daysAgo: 14 },
  { customer: "Noah Wilson", product: "Organic Granola", image: "/images/about-freshdrop.png", reason: "Wrong item", kind: "return", amount: 21.75, quantity: 1, daysAgo: 19 },
  { customer: "Ava Thompson", product: "Sparkling Water", image: "/images/hero-banner.png", reason: "Damaged item", kind: "cancellation", amount: 18.2, quantity: 1, daysAgo: 25 },
] as const;

function atDaysAgo(daysAgo: number, hour = 10): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysAgo, hour, 20));
}

async function main(): Promise<void> {
  for (const [index, item] of cases.entries()) {
    const suffix = String(index + 1).padStart(2, "0");
    const userId = `${PREFIX}user-${suffix}`;
    const productId = `${PREFIX}product-${suffix}`;
    const orderId = `${PREFIX}order-${suffix}`;
    const orderItemId = `${PREFIX}item-${suffix}`;
    const refundId = `${PREFIX}refund-${suffix}`;
    const createdAt = atDaysAgo(item.daysAgo, 10 + (index % 6));

    await prisma.user.upsert({ where: { id: userId }, create: { id: userId, phone: `70000000${suffix}`, name: item.customer, role: "customer" }, update: { name: item.customer } });
    await prisma.product.upsert({ where: { id: productId }, create: { id: productId, name: item.product, price: item.amount, imageUrl: item.image, categoryId: `${PREFIX}category`, stockQuantity: 30, isPublished: true }, update: { name: item.product, price: item.amount, imageUrl: item.image } });
    await prisma.order.upsert({
      where: { id: orderId },
      create: { id: orderId, userId, status: item.kind === "cancellation" ? "cancelled" : "archived", phase: "completed", paymentStatus: item.kind === "cancellation" ? "refunded" : "paid", placedAt: new Date(createdAt.getTime() - DAY_MS), location: "Demo delivery address", subtotal: item.amount, total: item.amount, shipping: 0, discount: 0 },
      update: { userId, status: item.kind === "cancellation" ? "cancelled" : "archived", paymentStatus: item.kind === "cancellation" ? "refunded" : "paid", placedAt: new Date(createdAt.getTime() - DAY_MS), subtotal: item.amount, total: item.amount },
    });
    await prisma.orderItem.upsert({ where: { id: orderItemId }, create: { id: orderItemId, orderId, productId, name: item.product, imageUrl: item.image, quantity: item.quantity, price: item.amount / item.quantity, position: 0 }, update: { name: item.product, imageUrl: item.image, quantity: item.quantity, price: item.amount / item.quantity } });
    await prisma.refund.upsert({ where: { id: refundId }, create: { id: refundId, orderId, userId, kind: item.kind, amount: item.amount, reason: item.reason, createdAt }, update: { kind: item.kind, amount: item.amount, reason: item.reason, createdAt } });
    await prisma.refundLine.upsert({ where: { id: `${PREFIX}line-${suffix}` }, create: { id: `${PREFIX}line-${suffix}`, refundId, orderItemId, productId, quantity: item.quantity, amount: item.amount }, update: { quantity: item.quantity, amount: item.amount } });
  }

  // Comparison-period rows make KPI changes and the dashed trend meaningful.
  for (let index = 0; index < 5; index += 1) {
    const base = cases[index];
    const suffix = String(index + 1).padStart(2, "0");
    const sourceOrderId = `${PREFIX}order-${suffix}`;
    const refundId = `${PREFIX}previous-refund-${suffix}`;
    const createdAt = atDaysAgo(36 + index * 5, 11);
    await prisma.refund.upsert({ where: { id: refundId }, create: { id: refundId, orderId: sourceOrderId, userId: `${PREFIX}user-${suffix}`, kind: base.kind, amount: Math.round(base.amount * 0.82 * 100) / 100, reason: base.reason, createdAt }, update: { createdAt } });
  }

  // Open requests are modeled as orders, matching the production repository.
  for (let index = 0; index < 2; index += 1) {
    const suffix = String(index + 1).padStart(2, "0");
    const id = `${PREFIX}request-${suffix}`;
    const source = cases[index];
    const placedAt = atDaysAgo(3 + index * 6, 9);
    await prisma.order.upsert({ where: { id }, create: { id, userId: `${PREFIX}user-${suffix}`, status: "return_requested", phase: "completed", paymentStatus: "paid", placedAt, location: "Demo delivery address", subtotal: source.amount, total: source.amount, shipping: 0, discount: 0 }, update: { status: "return_requested", placedAt } });
    await prisma.orderItem.upsert({ where: { id: `${id}-item` }, create: { id: `${id}-item`, orderId: id, productId: `${PREFIX}product-${suffix}`, name: source.product, imageUrl: source.image, quantity: 1, price: source.amount, position: 0 }, update: { name: source.product, imageUrl: source.image } });
  }

  console.log(`Seeded ${cases.length} current refunds, 5 comparison refunds, and 2 open return requests.`);
}

main().catch((error) => { console.error("Failed to seed refund report:", error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
