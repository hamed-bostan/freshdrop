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
import { OrderItemPickControl } from "./OrderItemPickControl";

type OrderDetailScreenProps = {
  order: Order;
  /** The customer who placed the order, when a matching summary exists. */
  customer: CustomerOrderSummary | undefined;
};

/**
 * Admin order-detail view. Presentational: the detail page fetches the order (and its
 * customer summary) over the REST API (BFF) during server render and passes them in.
 * Shows the horizontal delivery tracker, the primary "advance stage" action, the line
 * items (with pick controls while the order is being picked) totalled at the foot, and
 * a customer/address card. Stage/return/pick writes re-run this render via `router.refresh()`.
 */
export async function OrderDetailScreen({ order, customer }: OrderDetailScreenProps) {
  const t = await getTranslations("dashOrders");
  const locale = await getLocale();

  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const pickable = isPicking(order);
  const showTracking = order.status === "processing" || order.status === "completed";
  const advanceNext = isAdvanceable(order) && order.stage ? nextStage(order.stage) : null;

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
            <h1 className="truncate font-mono text-heading-h2 text-foreground">#{order.id}</h1>
            <p className="text-body-b6 text-muted-foreground">
              {t("placedOn", { date: formatOrderDate(order.placedAt, locale) })}
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
              <span className="text-body-b5 text-foreground">{formatMoney(orderNetPaid(order), locale)}</span>
            </div>
          </section>
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
          </section>
        </div>
      </div>
    </div>
  );
}
