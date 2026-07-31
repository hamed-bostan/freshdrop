import { useLocale, useTranslations } from "next-intl";
import {
  CircleDollarSign,
  ClipboardList,
  Dumbbell,
  House,
  MapPin,
  MessageSquareText,
  PackageCheck,
  Star,
  UserRound,
  WalletCards,
} from "lucide-react";
import type { CustomerDetail } from "@/src/domain/entities/CustomerDetail";
import type { DeliveryLocation } from "@/src/domain/entities/DeliveryLocation";
import type { LucideIcon } from "lucide-react";
import { Badge, Icon, RatingStars } from "@/src/presentation/design-system";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatOrderDate } from "@/src/lib/formatOrderDate";
import { formatMediumDate } from "@/src/lib/formatAnalyticsDate";

const PANEL_CLASS = "rounded-card-lg border border-border bg-background p-4";

export function CustomerSummaryPanel({ customer }: { customer: CustomerDetail }) {
  const t = useTranslations("dashCustomerDetail");
  const locale = useLocale();

  const rows = [
    { label: t("email"), value: customer.email ?? t("notProvided") },
    { label: t("customerGroup"), value: t(`role.${customer.role}`) },
    { label: t("phone"), value: customer.phone || t("notProvided") },
    { label: t("walletBalance"), value: formatMoney(customer.wallet.balance, locale) },
  ];

  return (
    <section className={PANEL_CLASS}>
      <PanelHeading icon={UserRound}>{t("customerSummary")}</PanelHeading>
      <dl className="mt-3 grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-body-b10">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-foreground">{row.label}</dt>
            <dd className="min-w-0 truncate text-muted-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const ADDRESS_ICON: Record<DeliveryLocation["kind"], LucideIcon> = {
  home: House,
  gym: Dumbbell,
  office: PackageCheck,
  other: MapPin,
};

export function CustomerAddressesCard({ addresses }: { addresses: DeliveryLocation[] }) {
  const t = useTranslations("dashCustomerDetail");

  return (
    <section className={PANEL_CLASS}>
      <PanelHeading icon={MapPin}>{t("addresses")}</PanelHeading>
      {addresses.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-3">
          {addresses.slice(0, 3).map((address, index) => (
            <li key={address.id} className="flex items-start gap-3">
              <span className={index === 0 ? "flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-primary" : "flex size-8 shrink-0 items-center justify-center rounded-full bg-info text-info-foreground"}>
                <Icon icon={ADDRESS_ICON[address.kind]} size="xs" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-body-b8 text-foreground">{address.label}</span>
                  {address.isDefault ? <Badge variant="primary" size="sm">{t("defaultAddress")}</Badge> : null}
                </div>
                <p className="line-clamp-2 text-body-b10 text-muted-foreground">{address.address}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="mt-3 text-body-b6 text-muted-foreground">{t("noAddresses")}</p>}
    </section>
  );
}

export function CustomerNotesCard({ customer }: { customer: CustomerDetail }) {
  const t = useTranslations("dashCustomerDetail");
  const locale = useLocale();
  const orderNumberById = new Map(customer.orders.map((order) => [order.id, order.orderNumber]));

  return (
    <section className={PANEL_CLASS}>
      <PanelHeading icon={MessageSquareText}>{t("internalNotes")}</PanelHeading>
      {customer.notes.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-3">
          {customer.notes.slice(0, 3).map((note) => (
            <li key={note.id} className="border-s-2 border-warning ps-3">
              <p className="text-body-b10 text-muted-foreground">
                {formatOrderDate(note.createdAt, locale)} · {note.authorName}
                {orderNumberById.get(note.orderId) ? ` · #${orderNumberById.get(note.orderId)}` : ""}
              </p>
              <p className="mt-0.5 line-clamp-2 text-body-b10 text-foreground">{note.body}</p>
            </li>
          ))}
        </ul>
      ) : <p className="mt-3 text-body-b6 text-muted-foreground">{t("noInternalNotes")}</p>}
    </section>
  );
}

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
      <h2 className="text-body-b8 text-foreground">{t("recentActivity")}</h2>
      {items.length > 0 ? (
        <ol className="mt-3 flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.id} className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-2 text-body-b10">
              <span className={`flex size-6 items-center justify-center rounded-full ${item.tone}`}><Icon icon={item.icon} size="xs" /></span>
              <div className="min-w-0">
                <p className="truncate text-foreground">{item.label}</p>
                {item.rating ? <RatingStars value={item.rating} size="sm" /> : null}
              </div>
              <div className="text-end">
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

function PanelHeading({ icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return <h2 className="flex items-center gap-2 text-body-b8 text-foreground"><Icon icon={icon} size="xs" />{children}</h2>;
}
