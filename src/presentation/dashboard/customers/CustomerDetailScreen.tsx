import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { ChevronLeft, Coins, Receipt, ShoppingBag, Wallet as WalletIcon } from "lucide-react";
import type { CustomerDetail } from "@/src/domain/entities/CustomerDetail";
import { isDashboardRole } from "@/src/domain/entities/User";
import { Link } from "@/src/i18n/navigation";
import { Avatar, Badge, Icon } from "@/src/presentation/design-system";
import { StatCard } from "@/src/presentation/dashboard/StatCard";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { formatOrderDate } from "@/src/lib/formatOrderDate";
import { CustomerAddressesPanel } from "./CustomerAddressesPanel";
import { CustomerOrdersPanel } from "./CustomerOrdersPanel";
import { CustomerReviewsPanel } from "./CustomerReviewsPanel";
import { CustomerWalletPanel } from "./CustomerWalletPanel";

type CustomerDetailScreenProps = {
  customer: CustomerDetail;
};

/**
 * Admin customer-detail view. Presentational: the detail page fetches the whole
 * customer over the REST API (BFF) during server render and passes it in — one
 * request, no client fetching, no first-paint spinner.
 *
 * Laid out as "who and what they're worth" across the top, then their history on the
 * left and the smaller facts (addresses, wallet, reviews) down the right. Read-only
 * throughout: every action an admin might want from here — advancing a delivery,
 * refunding, moderating a review — already belongs to the order or review it
 * concerns, and this page links out to those rather than growing a second set of
 * controls that would need the same guards.
 */
export async function CustomerDetailScreen({ customer }: CustomerDetailScreenProps) {
  const t = await getTranslations("dashCustomerDetail");
  const locale = await getLocale();
  const { lifetime } = customer;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/dashboard/customers"
          className="inline-flex w-fit items-center gap-1 text-body-b8 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Icon icon={ChevronLeft} size="xs" className="rtl:-scale-x-100" />
          {t("backToCustomers")}
        </Link>

        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={customer.name} className="size-14">
            {customer.avatarUrl && (
              <Image src={customer.avatarUrl} alt="" width={56} height={56} className="size-full object-cover" />
            )}
          </Avatar>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-heading-h2 text-foreground">{customer.name}</h1>
              {/* Only worth a pill when it's *not* the ordinary case — an admin
                  looking at a colleague's account should know before they act. */}
              {isDashboardRole(customer.role) ? (
                <Badge variant="primary" size="sm">
                  {t(`role.${customer.role}`)}
                </Badge>
              ) : null}
            </div>
            <p className="text-body-b6 text-muted-foreground">
              {customer.phone || t("noPhone")}
              {customer.email ? ` · ${customer.email}` : ""}
            </p>
            {/* Orders exist under an id nobody ever signed up with (seed and demo
                data). Saying so is kinder than showing a raw id as a name. */}
            {!customer.hasProfile ? (
              <p className="mt-1 text-body-b6 text-warning-foreground">{t("noProfile")}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("lifetimeSpend")}
          value={formatMoney(lifetime.totalSpent, locale)}
          hint={
            lifetime.firstOrderAt
              ? t("since", { date: formatOrderDate(lifetime.firstOrderAt, locale) })
              : undefined
          }
          icon={Coins}
          tone="brand"
        />
        <StatCard
          label={t("orderCount")}
          value={formatNumber(lifetime.orderCount, locale)}
          hint={
            lifetime.lastOrderAt
              ? t("lastOrdered", { date: formatOrderDate(lifetime.lastOrderAt, locale) })
              : undefined
          }
          icon={ShoppingBag}
          tone="info"
        />
        <StatCard
          label={t("averageOrder")}
          value={formatMoney(lifetime.averageOrderValue, locale)}
          icon={Receipt}
          tone="warning"
        />
        <StatCard
          label={t("walletBalance")}
          value={formatMoney(customer.wallet.balance, locale)}
          icon={WalletIcon}
          tone="danger"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="flex flex-col gap-4">
          <h2 className="text-body-b5 text-foreground">
            {t("orderHistory", { count: lifetime.orderCount })}
          </h2>
          <CustomerOrdersPanel orders={customer.orders} />
        </section>

        <div className="flex flex-col gap-6">
          <section className="rounded-card-lg border border-border p-5">
            <h2 className="mb-4 text-body-b5 text-foreground">{t("addresses")}</h2>
            <CustomerAddressesPanel addresses={customer.addresses} />
          </section>

          <section className="rounded-card-lg border border-border p-5">
            <h2 className="mb-4 text-body-b5 text-foreground">{t("wallet")}</h2>
            <CustomerWalletPanel wallet={customer.wallet} />
          </section>

          <section className="rounded-card-lg border border-border p-5">
            <h2 className="mb-4 text-body-b5 text-foreground">{t("reviews")}</h2>
            <CustomerReviewsPanel reviews={customer.reviews} />
          </section>
        </div>
      </div>
    </div>
  );
}
