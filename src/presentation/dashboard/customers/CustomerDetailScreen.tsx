import {
  CalendarDays,
  Check,
  ChevronLeft,
  Clock3,
  DollarSign,
  ExternalLink,
  Phone,
  Star,
  WalletCards,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

import type { CustomerDetail } from "@/src/domain/entities/CustomerDetail";
import { isDashboardRole } from "@/src/domain/entities/User";
import { Link } from "@/src/i18n/navigation";
import { formatMediumDate } from "@/src/lib/formatAnalyticsDate";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { formatOrderDate } from "@/src/lib/formatOrderDate";
import { formatRelativeTime } from "@/src/lib/formatRelativeTime";
import { Avatar, Badge, Button, Icon } from "@/src/presentation/design-system";

import { CustomerActivityCard } from "./CustomerActivityCard";
import { CustomerAddressesCard } from "./CustomerAddressesCard";
import { CustomerNotesCard } from "./CustomerNotesCard";
import { CustomerOrdersPanel } from "./CustomerOrdersPanel";
import { CustomerReviewsPanel } from "./CustomerReviewsPanel";
import { CustomerSummaryPanel } from "./CustomerSummaryPanel";
import { CustomerWalletPanel } from "./CustomerWalletPanel";
import { PANEL_CLASS, PanelHeading } from "./PanelHeading";

type CustomerDetailScreenProps = { customer: CustomerDetail };

export async function CustomerDetailScreen({ customer }: CustomerDetailScreenProps) {
  const t = await getTranslations("dashCustomerDetail");
  const locale = await getLocale();
  const { lifetime } = customer;
  const lastActivityAt = latestTimestamp([
    lifetime.lastOrderAt,
    ...customer.wallet.transactions.map((transaction) => transaction.date),
    ...customer.reviews.map((review) => review.createdAt),
  ]);

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[100rem] flex-col gap-6">
      <Link href="/dashboard/customers" className="inline-flex min-h-11 w-fit items-center gap-1 rounded-md focus-visible:outline-2 focus-visible:outline-primary text-body-b8 text-muted-foreground transition-colors hover:text-foreground">
        <Icon icon={ChevronLeft} size="xs" className="rtl:-scale-x-100" />
        {t("backToCustomers")}
      </Link>

      <header className="flex flex-col gap-5 rounded-card-lg border border-border bg-background p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-center gap-5">
          <Avatar name={customer.name} className="size-14 shrink-0 text-heading-h3 sm:size-16">
            {customer.avatarUrl ? <Image src={customer.avatarUrl} alt="" width={80} height={80} className="size-full object-cover" /> : null}
          </Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="dashboard-page-title break-words">{customer.name}</h1>
              {isDashboardRole(customer.role) ? <Badge variant="primary" size="sm">{t(`role.${customer.role}`)}</Badge> : null}
              {customer.hasProfile ? <Badge variant="success" size="sm"><Icon icon={Check} size="xs" className="me-1" />{t("profileActive")}</Badge> : null}
            </div>
            <p className="mt-1 flex items-center gap-2 text-body-b6 text-muted-foreground"><Icon icon={Phone} size="xs" />{customer.phone || t("noPhone")}</p>
            {!customer.hasProfile ? <p className="mt-1 text-body-b10 text-warning-foreground">{t("noProfile")}</p> : null}
          </div>
        </div>

        <Button variant="outline" size="sm" className="min-h-11 shrink-0" asChild>
          <Link href={`/dashboard/orders?q=${encodeURIComponent(customer.phone || customer.userId)}`}>
            {t("viewAllOrders")}<Icon icon={ExternalLink} size="xs" className="ms-2" />
          </Link>
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 xl:grid-cols-4">
        <CustomerMetric icon={DollarSign} tone="bg-accent text-primary" label={t("lifetimeSpend")} value={formatMoney(lifetime.totalSpent, locale)} hint={t("totalAcrossOrders", { count: lifetime.orderCount })} />
        <CustomerMetric icon={ShoppingBag} tone="bg-info text-info-foreground" label={t("orderCount")} value={formatNumber(lifetime.orderCount, locale)} hint={t("allTimeOrders")} />
        <CustomerMetric icon={CalendarDays} tone="bg-warning text-warning-foreground" label={t("customerSince")} value={lifetime.firstOrderAt ? formatMediumDate(lifetime.firstOrderAt, locale) : t("notAvailable")} hint={t("firstOrderDate")} />
        <CustomerMetric icon={Clock3} tone="bg-muted text-secondary" label={t("lastActive")} value={lastActivityAt ? formatRelativeTime(lastActivityAt, locale) : t("notAvailable")} hint={lastActivityAt ? formatOrderDate(lastActivityAt, locale) : undefined} />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <section className={PANEL_CLASS}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <PanelHeading icon={ShoppingBag}>{t("orderHistoryTitle")}</PanelHeading>
              <Link href={`/dashboard/orders?q=${encodeURIComponent(customer.phone || customer.userId)}`} className="inline-flex min-h-11 items-center gap-1 rounded-md text-body-b8 text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary">
                {t("viewAllOrders")}<Icon icon={ExternalLink} size="xs" />
              </Link>
            </div>
            <CustomerOrdersPanel orders={customer.orders} />
          </section>

          <section className={PANEL_CLASS}>
            <div className="mb-5"><PanelHeading icon={WalletCards}>{t("wallet")}</PanelHeading></div>
            <CustomerWalletPanel wallet={customer.wallet} />
          </section>

          <section className={PANEL_CLASS}>
            <div className="mb-5"><PanelHeading icon={Star}>{t("reviews")}</PanelHeading></div>
            <CustomerReviewsPanel reviews={customer.reviews} />
          </section>
        </div>
        <aside className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-1">
          <CustomerSummaryPanel customer={customer} />
          <CustomerAddressesCard addresses={customer.addresses} />
          <CustomerNotesCard customer={customer} />
          <CustomerActivityCard customer={customer} />
        </aside>
      </div>
    </div>
  );
}

function CustomerMetric({ icon, tone, label, value, hint }: { icon: LucideIcon; tone: string; label: string; value: string; hint?: string }) {
  return (
    <article className="flex min-w-0 flex-col gap-3 rounded-card-lg border border-border bg-background p-4 sm:p-5">
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon icon={icon} size="sm" /></span>
      <div className="min-w-0">
        <p className="text-body-b10 text-muted-foreground">{label}</p>
        <p className="mt-2 break-words text-body-b1 sm:text-heading-h3 tabular-nums text-foreground">{value}</p>
        {hint ? <p className="mt-2 break-words text-body-b10 text-muted-foreground">{hint}</p> : null}
      </div>
    </article>
  );
}

function latestTimestamp(values: (string | null)[]): string | null {
  return values.filter((value): value is string => Boolean(value)).sort().at(-1) ?? null;
}
