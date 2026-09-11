import { CircleDollarSign, ClipboardList, Star, WalletCards, type LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type { CustomerDetail } from "@/src/domain/entities/CustomerDetail";
import { formatMediumDate } from "@/src/lib/formatAnalyticsDate";
import { formatMoney } from "@/src/lib/formatMoney";
import { Icon, RatingStars } from "@/src/presentation/design-system";

import { PANEL_CLASS, PanelHeading } from "./PanelHeading";

type ActivityItem = {
  id: string;
  date: string;
  label: string;
  amount?: number;
  icon: LucideIcon;
  tone: string;
  rating?: number;
};

export function CustomerActivityCard({ customer }: { customer: CustomerDetail }) {
  const t = useTranslations("dashCustomerDetail");
  const locale = useLocale();
  const items: ActivityItem[] = [
    ...customer.orders.map((order) => ({
      id: `order-${order.id}`,
      date: order.placedAt,
      label: t("activityOrderPlaced", { number: order.orderNumber }),
      icon: ClipboardList,
      tone: "bg-accent text-primary",
    })),
    ...customer.wallet.transactions.map((transaction) => ({
      id: `wallet-${transaction.id}`,
      date: transaction.date,
      label: transaction.description,
      amount: transaction.type === "credit" ? transaction.amount : -transaction.amount,
      icon: transaction.type === "credit" ? CircleDollarSign : WalletCards,
      tone: "bg-info text-info-foreground",
    })),
    ...customer.reviews.map((review) => ({
      id: `review-${review.id}`,
      date: review.createdAt,
      label: t("activityReviewSubmitted"),
      icon: Star,
      tone: "bg-warning text-warning-foreground",
      rating: review.rating,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return (
    <section className={PANEL_CLASS}>
      <PanelHeading icon={ClipboardList}>{t("recentActivity")}</PanelHeading>
      {items.length > 0 ? (
        <ol className="mt-5 flex flex-col gap-4">
          {items.map((item) => (
            <li key={item.id} className="grid grid-cols-[1.5rem_minmax(0,1fr)] items-center gap-2 text-body-b10">
              <span className={`flex size-6 items-center justify-center rounded-full ${item.tone}`}><Icon icon={item.icon} size="xs" /></span>
              <div className="min-w-0">
                <p className="break-words text-foreground">{item.label}</p>
                {item.rating ? <RatingStars value={item.rating} size="sm" /> : null}
              </div>
              <div className="col-start-2 flex flex-wrap items-center justify-between gap-2">
                {item.amount !== undefined ? <p className={item.amount >= 0 ? "font-semibold text-primary" : "font-semibold text-destructive"}>{item.amount >= 0 ? "+" : ""}{formatMoney(item.amount, locale)}</p> : null}
                <time className="whitespace-nowrap text-muted-foreground" dateTime={item.date}>{formatMediumDate(item.date, locale)}</time>
              </div>
            </li>
          ))}
        </ol>
      ) : <p className="mt-3 text-body-b6 text-muted-foreground">{t("noRecentActivity")}</p>}
    </section>
  );
}
