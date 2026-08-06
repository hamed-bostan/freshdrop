import { notFound } from "next/navigation";
import { DEFAULT_ACTIVITY_LIMIT } from "@/src/domain/entities/ActivityEntry";
import { ordersServerApi } from "@/src/presentation/dashboard/orders/order-server-api";
import { customersServerApi } from "@/src/presentation/dashboard/customers/customer-server-api";
import { activityServerApi } from "@/src/presentation/dashboard/activity/activity-server-api";
import { OrderDetailScreen } from "@/src/presentation/dashboard/orders/OrderDetailScreen";
import { auth } from "@/auth";
import { sessionHas } from "@/src/lib/require-permission";
import { orderNotesServerApi } from "@/src/presentation/dashboard/orders/order-note-server-api";
import { orderDeliveryIssuesServerApi } from "@/src/presentation/dashboard/orders/order-delivery-issue-server-api";

// The order is read from the REST API (BFF) per request — never statically cached.
export const dynamic = "force-dynamic";

type DashboardOrderPageProps = { params: Promise<{ id: string }> };

export default async function DashboardOrderPage({ params }: DashboardOrderPageProps) {
  const { id } = await params;

  // The dashboard layout already gates this tree to admins; the BFF forwards the
  // admin's session cookie so the admin endpoints authorize the calls.
  const order = await ordersServerApi.getById(id);
  if (!order) notFound();

  // Only this order's customer, to label the order with who placed it. Sequential
  // rather than parallel because the id to look up comes from the order — the
  // previous parallel fetch could only manage that by reading *every* customer
  // and finding one in the result.
  // The customer and the order's activity are both keyed off the order, so they
  // run together once it's in hand.
  const [customers, activity, notes, deliveryIssues, session] = await Promise.all([
    customersServerApi.listByIds([order.userId]),
    activityServerApi.listForEntity("order", order.id, DEFAULT_ACTIVITY_LIMIT),
    orderNotesServerApi.listForOrder(order.id),
    order.deliveryType === "delivery" ? orderDeliveryIssuesServerApi.listForOrder(order.id) : Promise.resolve([]),
    auth(),
  ]);
  const customer = customers.items[0];

  // Which controls the screen draws. Support reads this page in full and can write
  // only a note; the endpoints behind each control re-check regardless.
  const [canFulfill, canNotify, canNote, canIssueRefund] = await Promise.all([
    sessionHas(session, "orders.fulfill"),
    sessionHas(session, "orders.notify"),
    sessionHas(session, "orders.note"),
    sessionHas(session, "refunds.issue"),
  ]);

  // The ad hoc message form's starting subject/body (phase 4) — only fetched
  // when the viewer can actually send one, matching the endpoint's own gate.
  const messageDefault = canNotify ? await ordersServerApi.messageDefault(order.id) : undefined;
  // The pending return's items, for the inspection panel — only fetched when
  // there's actually a return to show, matching the section's own gate.
  const returnRequest =
    canFulfill && order.status === "return_requested" ? await ordersServerApi.getReturnRequest(order.id) : null;

  return (
    <OrderDetailScreen
      order={order}
      customer={customer}
      activity={activity}
      notes={notes}
      deliveryIssues={deliveryIssues}
      canFulfill={canFulfill}
      canNotify={canNotify}
      canNote={canNote}
      canIssueRefund={canIssueRefund}
      messageDefault={messageDefault}
      returnRequest={returnRequest}
    />
  );
}
