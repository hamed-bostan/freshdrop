import { getTranslations } from "next-intl/server";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import { CustomersTable } from "./CustomersTable";

type CustomersScreenProps = {
  /** Per-customer order summaries, ranked by total spend (highest first). */
  customers: CustomerOrderSummary[];
};

/**
 * Admin customers list. Presentational: the dashboard page fetches the per-customer
 * order summaries over the REST API (BFF) during server render and passes them in —
 * no client data state, so the server stays the single source of truth. Every column
 * (order count, total spend, last order) is already carried on the summary, so this
 * only lays them out.
 */
export async function CustomersScreen({ customers }: CustomersScreenProps) {
  const t = await getTranslations("dashCustomers");
  const count = customers.length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-heading-h2 text-foreground">{t("heading")}</h1>
        <p className="text-body-b6 text-muted-foreground">{t("summary", { count })}</p>
      </div>

      {count > 0 ? (
        <CustomersTable customers={customers} />
      ) : (
        <div className="rounded-card-lg border border-dashed border-border px-6 py-16 text-center">
          <p className="text-body-b4 text-foreground">{t("emptyTitle")}</p>
          <p className="mt-1 text-body-b6 text-muted-foreground">{t("emptyBody")}</p>
        </div>
      )}
    </div>
  );
}
