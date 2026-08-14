import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { Order } from "@/src/domain/entities/Order";
import type { Product } from "@/src/domain/entities/Product";

vi.mock("next-intl/server", () => ({
  getLocale: async () => "en",
  getTranslations: async () => (key: string, values?: Record<string, string | number>) => {
    const labels: Record<string, string> = {
      recentOrders: "Recent orders",
      viewAll: "View all",
      viewAllOrders: "View all orders",
      lowStockProducts: "Low-stock products",
      viewAllInventory: "View all inventory",
      manage: "Manage",
      colOrder: "Order",
      colCustomer: "Customer",
      colStatus: "Status",
      colTotal: "Total",
      colPlaced: "Placed",
      colAction: "Action",
    };
    if (key === "viewOrderAria") return `View order ${values?.id}`;
    if (key === "unitsRemaining") return `${values?.count} units remaining`;
    if (key === "manageProductAria") return `Manage ${values?.product} inventory`;
    return labels[key] ?? key;
  },
}));

vi.mock("@/src/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: unknown; alt: string }) => (
    <span role="img" aria-label={alt || undefined} data-src={typeof src === "string" ? src : "mock-image"} />
  ),
}));

vi.mock("@/src/presentation/orders/components/OrderStatusBadge", () => ({
  OrderStatusBadge: ({ status }: { status: string }) => <span data-status={status}>{status}</span>,
}));

vi.mock("@/src/presentation/design-system", () => ({
  focusRing: "focus-ring",
  Icon: () => <svg aria-hidden="true" />,
  Thumbnail: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => <span {...props}>{children}</span>,
  Table: (props: React.TableHTMLAttributes<HTMLTableElement>) => <table {...props} />,
  TableBody: (props: React.HTMLAttributes<HTMLTableSectionElement>) => <tbody {...props} />,
  TableCell: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => <td {...props} />,
  TableHead: ({ scope = "col", ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => <th scope={scope} {...props} />,
  TableHeader: (props: React.HTMLAttributes<HTMLTableSectionElement>) => <thead {...props} />,
  TableRow: (props: React.HTMLAttributes<HTMLTableRowElement>) => <tr {...props} />,
}));

import { LowStockPanel } from "../LowStockPanel";
import { RecentOrdersPanel } from "../RecentOrdersPanel";

const order = {
  id: "order-64",
  orderNumber: 64,
  userId: "customer-1",
  status: "processing",
  placedAt: "2026-08-04T10:03:00.000Z",
  total: 76.22,
  refunds: [],
} as unknown as Order;

const products = ["Lemon Iced Tea", "Sauvignon Blanc", "Bananas"].map((name, index) => ({
  id: `product-${index}`,
  name,
  imageUrl: `/products/${index}.png`,
  stockQuantity: index,
})) as Product[];

describe("dashboard overview panels", () => {
  it("renders Recent orders as mobile list plus a semantic desktop table", async () => {
    const element = await RecentOrdersPanel({
      orders: [order],
      customersById: new Map([["customer-1", {
        userId: "customer-1",
        name: "Hamed Bostan",
        phone: "",
        email: null,
        avatarUrl: null,
        orderCount: 1,
        totalSpent: 76.22,
        lastOrderAt: order.placedAt,
        rank: 1,
      }]]),
    });
    const html = renderToStaticMarkup(element);
    const mobileMarkup = html.match(/<ul[^>]*>([\s\S]*?)<\/ul>/)?.[0] ?? "";

    expect(html).toContain("<table");
    expect(html.match(/scope="col"/g)).toHaveLength(6);
    expect(html).toContain("View order 64");
    expect(html).toContain("2026");
    expect(mobileMarkup).toContain("2026");
    expect(html).not.toContain("min-w-[");
  });

  it("gives each inventory action a unique accessible name without viewport-specific row dimensions", async () => {
    const html = renderToStaticMarkup(await LowStockPanel({ products }));

    expect(html).toContain('aria-label="Manage Lemon Iced Tea inventory"');
    expect(html).toContain('aria-label="Manage Sauvignon Blanc inventory"');
    expect(html).toContain('aria-label="Manage Bananas inventory"');
    expect(html).not.toContain("grid-cols-[");
    expect(html).not.toContain("min-h-[");
    expect(html).toContain("View all inventory");
  });
});
