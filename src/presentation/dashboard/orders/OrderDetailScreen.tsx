import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { ChevronLeft, ArrowLeftRight, RotateCcw } from "lucide-react";
import type { Order } from "@/src/domain/entities/Order";
import { isPicking, orderNetPaid, orderRefundedTotal } from "@/src/domain/entities/Order";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import { Link } from "@/src/i18n/navigation";
import { Icon } from "@/src/presentation/design-system";
import { OrderStatusBadge } from "@/src/presentation/orders/components/OrderStatusBadge";
import { TrackingStepper } from "@/src/presentation/orders/components/TrackingStepper";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { formatOrderDate } from "@/src/lib/formatOrderDate";
import { deliverySteps, isAdvanceable, nextStage } from "./orderStages";
import { OrderStageAdvance } from "./OrderStageAdvance";
import { OrderReturnControl } from "./OrderReturnControl";
import { OrderItemPickControl } from "./OrderItemPickControl";

type OrderDetailScreenProps = {
  order: Order;
  /** The customer who placed the order, when a matching summary exists. */
  customer: CustomerOrderSummary | undefined;
};

/**
 * Admin order-detail view. Presentational: the detail page fetches the order (and its
 * customer summary) over the REST API (BFF) during server render and passes them in.
 * Shows the delivery timeline, the primary "advance stage" action, the line items
 * (with pick controls while the order is being picked), and a customer/summary card.
 * Stage/return/pick writes re-run this server render via `router.refresh()`.
 */
export async function OrderDetailScreen({ order, customer }: OrderDetailScreenProps) {
  const t = await getTranslations("dashOrders");
  const locale = await getLocale();

  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const pickable = isPicking(order);
  const showTimeline = order.status === "processing" || order.status === "completed";
  const advanceNext = isAdvanceable(order) && order.stage ? nextStage(order.stage) : null;
  const refunded = orderRefundedTotal(order);

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
          <div>
            <h1 className="text-heading-h2 text-foreground">{t("orderNumber", { id: order.id })}</h1>
            <p className="text-body-b6 text-muted-foreground">
              {t("placedOn", { date: formatOrderDate(order.placedAt, locale) })}
            </p>
          </div>
          <OrderStatusBadge status={order.status} stage={order.stage} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* Left column: timeline + advance action, then the line items. */}
        <div className="flex flex-col gap-6">
          {showTimeline ? (
            <section className="rounded-card-lg border border-border p-5">
              <h2 className="text-body-b5 text-foreground">{t("timeline")}</h2>
              <div className="mt-4">
                <TrackingStepper steps={deliverySteps(order)} />
              </div>
              {advanceNext ? (
                <div className="mt-4 border-t border-border pt-4">
                  <OrderStageAdvance orderId={order.id} next={advanceNext} />
                </div>
              ) : null}
            </section>
          ) : null}

          {order.status === "return_requested" ? (
            <section className="rounded-card-lg border border-border p-5">
              <h2 className="text-body-b5 text-foreground">{t("returnHeading")}</h2>
              <p className="mt-1 text-body-b7 text-muted-foreground">{t("returnBody")}</p>
              <div className="mt-4 flex justify-start">
                <OrderReturnControl orderId={order.id} />
              </div>
            </section>
          ) : null}

          <section className="rounded-card-lg border border-border p-5">
            <h2 className="text-body-b8 uppercase tracking-wide text-muted-foreground">
              {t("itemCount", { count: itemCount })}
            </h2>
            <ul className="mt-4 flex flex-col gap-4">
              {order.items.map((item) => {
                const isRefunded = item.substitution?.status === "refunded";
                return (
                  <li key={item.productId} className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-card-md bg-surface-sunken">
                        <Image
                          src={item.imageUrl}
                          alt=""
                          width={44}
                          height={44}
                          className={`size-full object-contain ${isRefunded ? "opacity-40" : ""}`}
                        />
                      </span>
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
          </section>
        </div>

        {/* Right column: customer + delivery, then the price breakdown. */}
        <div className="flex flex-col gap-6">
          <section className="rounded-card-lg border border-border p-5">
            <h2 className="text-body-b5 text-foreground">{t("customerHeading")}</h2>
            <dl className="mt-4 flex flex-col gap-3 text-body-b7">
              <div>
                <dt className="text-body-b8 text-muted-foreground">{t("colCustomer")}</dt>
                <dd className="text-foreground">{customer?.name ?? order.userId}</dd>
                {customer?.phone ? <dd className="text-muted-foreground">{customer.phone}</dd> : null}
              </div>
              <div>
                <dt className="text-body-b8 text-muted-foreground">{t("colAddress")}</dt>
                <dd className="text-foreground">{order.location}</dd>
                {order.locationLabel ? (
                  <dd className="text-muted-foreground">{order.locationLabel}</dd>
                ) : null}
              </div>
              {order.deliveryWindow ? (
                <div>
                  <dt className="text-body-b8 text-muted-foreground">{t("deliveryWindow")}</dt>
                  <dd className="text-foreground">{order.deliveryWindow}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="rounded-card-lg border border-border p-5">
            <h2 className="text-body-b5 text-foreground">{t("summaryHeading")}</h2>
            <dl className="mt-4 flex flex-col gap-2 text-body-b7">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">{t("subtotal")}</dt>
                <dd className="text-foreground">{formatMoney(order.subtotal, locale)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">{t("shipping")}</dt>
                <dd className="text-foreground">{formatMoney(order.shipping, locale)}</dd>
              </div>
              {order.discount > 0 ? (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">{t("discount")}</dt>
                  <dd className="text-primary">−{formatMoney(order.discount, locale)}</dd>
                </div>
              ) : null}
              <div className="flex items-center justify-between border-t border-border pt-2">
                <dt className="text-foreground">{t("total")}</dt>
                <dd className="text-body-b5 text-foreground">{formatMoney(order.total, locale)}</dd>
              </div>
              {refunded > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">{t("refundedToWallet")}</dt>
                    <dd className="text-muted-foreground">−{formatMoney(refunded, locale)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-foreground">{t("netPaid")}</dt>
                    <dd className="text-foreground">{formatMoney(orderNetPaid(order), locale)}</dd>
                  </div>
                </>
              ) : null}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
