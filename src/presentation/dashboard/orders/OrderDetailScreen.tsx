import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { ChevronLeft, ArrowLeftRight, RotateCcw } from "lucide-react";
import type { Order } from "@/src/domain/entities/Order";
import { isPicking, orderNetPaid } from "@/src/domain/entities/Order";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import { Link } from "@/src/i18n/navigation";
import { Icon, Thumbnail } from "@/src/presentation/design-system";
import { OrderStatusBadge } from "@/src/presentation/orders/components/OrderStatusBadge";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { formatOrderDate } from "@/src/lib/formatOrderDate";
import { deliverySteps, isAdvanceable, nextStage } from "./orderStages";
import { OrderDeliveryTracker } from "./OrderDeliveryTracker";
import { OrderStageAdvance } from "./OrderStageAdvance";
import { OrderReturnControl } from "./OrderReturnControl";
import { OrderRefundControl } from "./OrderRefundControl";
import { OrderItemPickControl } from "./OrderItemPickControl";
import { OrderCommsPanel } from "./OrderCommsPanel";
import { OrderNotesPanel } from "./OrderNotesPanel";
import { ActivityPanel } from "@/src/presentation/dashboard/activity/ActivityPanel";
import type { ActivityEntryWire } from "@/src/presentation/dashboard/activity/activity-response-schema";
import type { OrderNote } from "@/src/domain/entities/OrderNote";
import type { OrderMessageDefaultWire } from "./order-message-default-response-schema";

type OrderDetailScreenProps = {
  order: Order;
  /** The customer who placed the order, when a matching summary exists. */
  customer: CustomerOrderSummary | undefined;
  /** This order's recent admin activity, newest first. */
  activity: ActivityEntryWire[];
  /**
   * Whether the viewer may move the order along — advance the stage, pick items,
   * resolve a return. Support reads this page without any of that.
   */
  canFulfill: boolean;
  /** Whether the viewer may message the customer about it. */
  canNotify: boolean;
  /** The order's internal notes, newest first. */
  notes: OrderNote[];
  /** Whether the viewer may add one. Every dashboard role can, including support. */
  canNote: boolean;
  /** Whether the viewer may issue a discretionary refund (phase 7) — admin/owner only. */
  canIssueRefund: boolean;
  /** The ad hoc message form's starting subject/body (phase 4) — undefined when `!canNotify`. */
  messageDefault?: OrderMessageDefaultWire;
};

/**
 * Admin order-detail view. Presentational: the detail page fetches the order (and its
 * customer summary) over the REST API (BFF) during server render and passes them in.
 * Shows the horizontal delivery tracker, the primary "advance stage" action, the line
 * items (with pick controls while the order is being picked) totalled at the foot, and
 * a customer/address card. Stage/return/pick writes re-run this render via `router.refresh()`.
 */
export async function OrderDetailScreen({
  order,
  customer,
  activity,
  canFulfill,
  canNotify,
  notes,
  canNote,
  canIssueRefund,
  messageDefault,
}: OrderDetailScreenProps) {
  const t = await getTranslations("dashOrders");
  const locale = await getLocale();

  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const showTracking = order.status === "processing" || order.status === "completed";
  // Controls are drawn only for what the viewer may actually do; every endpoint
  // behind them re-checks, so this is about not offering a button that can only 401.
  const advanceNext = canFulfill && isAdvanceable(order) && order.stage ? nextStage(order.stage) : null;
  const pickable = canFulfill && isPicking(order);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/dashboard/orders"
          className="inline-flex w-fit items-center gap-1 text-body-b8 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Icon icon={ChevronLeft} size="xs" className="rtl:-scale-x-100" />
          {t("backToOrders")}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-heading-h2 text-foreground">
              {t("orderNumber", { id: order.orderNumber })}
            </h1>
            <p className="text-body-b6 text-muted-foreground">
              {t("placedOn", { date: formatOrderDate(order.placedAt, locale) })}
            </p>
            {/* The full id, for support conversations and log lookups — the number
                above is what an operator says out loud, this is what they grep for. */}
            <p className="truncate font-mono text-body-b9 text-muted-foreground">
              {t("internalId", { id: order.id })}
            </p>
          </div>
          <OrderStatusBadge status={order.status} stage={order.stage} context="admin" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* Left column: delivery tracking + advance action, then the line items. */}
        <div className="flex flex-col gap-6">
          {showTracking ? (
            <section className="rounded-card-lg border border-border p-5">
              <h2 className="text-body-b5 text-foreground">{t("tracking")}</h2>
              <div className="mt-6">
                <OrderDeliveryTracker steps={deliverySteps(order)} />
              </div>
              {advanceNext ? (
                <div className="mt-6">
                  <OrderStageAdvance orderId={order.id} next={advanceNext} />
                </div>
              ) : null}
            </section>
          ) : null}

          {canFulfill && order.status === "return_requested" ? (
            <section className="rounded-card-lg border border-border p-5">
              <h2 className="text-body-b5 text-foreground">{t("returnHeading")}</h2>
              <p className="mt-1 text-body-b7 text-muted-foreground">{t("returnBody")}</p>
              <div className="mt-4 flex justify-start">
                <OrderReturnControl orderId={order.id} />
              </div>
            </section>
          ) : null}

          <section className="rounded-card-lg border border-border p-5">
            <h2 className="text-body-b5 text-foreground">{t("itemCount", { count: itemCount })}</h2>
            <ul className="mt-4 flex flex-col gap-4">
              {order.items.map((item) => {
                const isRefunded = item.substitution?.status === "refunded";
                return (
                  <li key={item.productId} className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <Thumbnail as="span" className="size-11">
                        <Image
                          src={item.imageUrl}
                          alt=""
                          width={44}
                          height={44}
                          className={`size-full object-contain ${isRefunded ? "opacity-40" : ""}`}
                        />
                      </Thumbnail>
                      <span
                        className={`min-w-0 flex-1 truncate text-body-b7 ${
                          isRefunded ? "text-muted-foreground line-through" : "text-foreground"
                        }`}
                      >
                        {item.name}
                      </span>
                      <span className="shrink-0 text-body-b7 text-muted-foreground">
                        {t("qtyTimesPrice", {
                          qty: formatNumber(item.quantity, locale),
                          price: formatMoney(item.price, locale),
                        })}
                      </span>
                    </div>

                    {item.substitution ? (
                      item.substitution.status === "substituted" ? (
                        <p className="flex items-center gap-1.5 ps-14 text-body-b8 text-primary">
                          <Icon icon={ArrowLeftRight} size="xs" />
                          {t("substitutedWith", {
                            name: item.substitution.replacement?.name ?? t("replacementFallback"),
                          })}
                        </p>
                      ) : (
                        <p className="flex items-center gap-1.5 ps-14 text-body-b8 text-muted-foreground">
                          <Icon icon={RotateCcw} size="xs" />
                          {t("refundedOutOfStock")}
                        </p>
                      )
                    ) : pickable ? (
                      <div className="ps-14">
                        <OrderItemPickControl orderId={order.id} item={item} />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="text-body-b7 text-muted-foreground">{t("total")}</span>
              <span className="text-body-b5 text-foreground">{formatMoney(orderNetPaid(order, order.refunds), locale)}</span>
            </div>
            {order.taxAmount != null && (
              <p className="mt-1 text-end text-body-b9 text-muted-foreground">
                {t("includesVat", { amount: formatMoney(order.taxAmount, locale) })}
              </p>
            )}
          </section>

          {/* Below the line items, since it's what to refund is drawn from — and
              above the activity log, which is where an issued refund then shows up. */}
          {canIssueRefund ? <OrderRefundControl order={order} /> : null}

          {/* Under the order itself: above is what the order is now, this is every
              hand that has been on it — stage overrides, substitutions, returns. */}
          <ActivityPanel entries={activity} />
        </div>

        {/* Right column: who placed the order and where it's going. */}
        <div className="flex flex-col gap-6">
          <section className="rounded-card-lg border border-border p-5">
            <h2 className="text-body-b8 uppercase tracking-wide text-muted-foreground">
              {t("customerHeading")}
            </h2>
            <p className="mt-2 text-body-b6 text-foreground">{customer?.name ?? order.userId}</p>
            {customer?.phone ? (
              <p className="mt-0.5 text-body-b7 text-muted-foreground">{customer.phone}</p>
            ) : null}

            <h3 className="mt-6 text-body-b8 uppercase tracking-wide text-muted-foreground">
              {t("deliveryAddress")}
            </h3>
            <p className="mt-2 text-body-b7 text-foreground">{order.location}</p>
            {order.locationLabel ? (
              <p className="mt-0.5 text-body-b7 text-muted-foreground">{order.locationLabel}</p>
            ) : null}

            {/* A link out to the whole customer rather than more of them inline —
                their history, wallet and addresses have a page of their own. */}
            <Link
              href={`/dashboard/customers/${order.userId}`}
              className="mt-6 inline-block text-body-b8 text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
            >
              {t("viewCustomer")}
            </Link>
          </section>

          {/* Above comms, deliberately: notes are what the people working the order
              tell each other, and reading them is what should inform anything you
              then decide to send the customer. */}
          <section className="rounded-card-lg border border-border p-5">
            <h2 className="mb-4 text-body-b8 uppercase tracking-wide text-muted-foreground">
              {t("notesHeading")}
            </h2>
            <OrderNotesPanel orderId={order.id} notes={notes} canWrite={canNote} />
          </section>

          {/* Below the customer card, because that's who these go to. */}
          {canNotify ? (
            <section className="rounded-card-lg border border-border p-5">
              <h2 className="mb-4 text-body-b8 uppercase tracking-wide text-muted-foreground">
                {t("commsHeading")}
              </h2>
              <OrderCommsPanel order={order} canEmail={customer?.email != null} messageDefault={messageDefault} />
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
