import {
  CalendarDays,
  Check,
  ChevronLeft,
  Clock3,
  DollarSign,
  ExternalLink,
  Phone,
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
    <div className="flex flex-col gap-4">
      <Link href="/dashboard/customers" className="inline-flex w-fit items-center gap-1 text-body-b8 text-muted-foreground transition-colors hover:text-foreground">
        <Icon icon={ChevronLeft} size="xs" className="rtl:-scale-x-100" />
        {t("backToCustomers")}
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-5">
          <Avatar name={customer.name} className="size-20 shrink-0 text-heading-h3">
            {customer.avatarUrl ? <Image src={customer.avatarUrl} alt="" width={80} height={80} className="size-full object-cover" /> : null}
          </Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-heading-h2 text-foreground">{customer.name}</h1>
              {isDashboardRole(customer.role) ? <Badge variant="primary" size="sm">{t(`role.${customer.role}`)}</Badge> : null}
              {customer.hasProfile ? <Badge variant="success" size="sm"><Icon icon={Check} size="xs" className="me-1" />{t("profileActive")}</Badge> : null}
            </div>
            <p className="mt-1 flex items-center gap-2 text-body-b6 text-muted-foreground"><Icon icon={Phone} size="xs" />{customer.phone || t("noPhone")}</p>
            {!customer.hasProfile ? <p className="mt-1 text-body-b10 text-warning-foreground">{t("noProfile")}</p> : null}
          </div>
        </div>

        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/orders?q=${encodeURIComponent(customer.phone || customer.userId)}`}>
            {t("viewAllOrders")}<Icon icon={ExternalLink} size="xs" className="ms-2" />
          </Link>
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2.05fr)_minmax(19rem,0.9fr)]">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <CustomerMetric icon={DollarSign} tone="bg-accent text-primary" label={t("lifetimeSpend")} value={formatMoney(lifetime.totalSpent, locale)} hint={t("totalAcrossOrders", { count: lifetime.orderCount })} />
          <CustomerMetric icon={ShoppingBag} tone="bg-info text-info-foreground" label={t("orderCount")} value={formatNumber(lifetime.orderCount, locale)} hint={t("allTimeOrders")} />
          <CustomerMetric icon={CalendarDays} tone="bg-warning text-warning-foreground" label={t("customerSince")} value={lifetime.firstOrderAt ? formatMediumDate(lifetime.firstOrderAt, locale) : t("notAvailable")} hint={t("firstOrderDate")} />
          <CustomerMetric icon={Clock3} tone="bg-muted text-secondary" label={t("lastActive")} value={lastActivityAt ? formatRelativeTime(lastActivityAt, locale) : t("notAvailable")} hint={lastActivityAt ? formatOrderDate(lastActivityAt, locale) : undefined} />
        </div>
        <CustomerSummaryPanel customer={customer} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2.05fr)_minmax(19rem,0.9fr)]">
        <section className="min-w-0 rounded-card-lg border border-border bg-background p-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-body-b5 text-foreground">{t("orderHistoryTitle")}</h2>
            <Link href={`/dashboard/orders?q=${encodeURIComponent(customer.phone || customer.userId)}`} className="inline-flex items-center gap-1 text-body-b10 text-muted-foreground hover:text-primary">
              {t("viewAllOrders")}<Icon icon={ExternalLink} size="xs" />
            </Link>
          </div>
          <CustomerOrdersPanel orders={customer.orders} />
        </section>

        <aside className="flex min-w-0 flex-col gap-3">
          <CustomerAddressesCard addresses={customer.addresses} />
          <CustomerNotesCard customer={customer} />
          <CustomerActivityCard customer={customer} />
        </aside>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="min-w-0 rounded-card-lg border border-border bg-background p-4">
          <h2 className="mb-4 text-body-b5 text-foreground">{t("wallet")}</h2>
          <CustomerWalletPanel wallet={customer.wallet} />
        </section>

        <section className="min-w-0 rounded-card-lg border border-border bg-background p-4">
          <h2 className="mb-4 text-body-b5 text-foreground">{t("reviews")}</h2>
          <CustomerReviewsPanel reviews={customer.reviews} />
        </section>
      </div>
    </div>
  );
}

function CustomerMetric({ icon, tone, label, value, hint }: { icon: LucideIcon; tone: string; label: string; value: string; hint?: string }) {
  return (
    <article className="flex min-h-32 items-center gap-4 rounded-card-lg border border-border bg-background p-4">
      <span className={`flex size-12 shrink-0 items-center justify-center rounded-full ${tone}`}><Icon icon={icon} size="sm" /></span>
      <div className="min-w-0">
        <p className="text-body-b10 text-muted-foreground">{label}</p>
        <p className="mt-1 truncate text-heading-h3 text-foreground">{value}</p>
        {hint ? <p className="mt-2 truncate text-body-b10 text-muted-foreground">{hint}</p> : null}
      </div>
    </article>
  );
}

function latestTimestamp(values: (string | null)[]): string | null {
  return values.filter((value): value is string => Boolean(value)).sort().at(-1) ?? null;
}
