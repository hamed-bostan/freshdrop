"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import { Icon, Input } from "@/src/presentation/design-system";
import { CustomersTable } from "./CustomersTable";

type CustomersScreenProps = {
  /** Per-customer order summaries, ranked by total spend (highest first). */
  customers: CustomerOrderSummary[];
};

/**
 * Admin customers list. Presentational: the dashboard page fetches the per-customer
 * order summaries over the REST API (BFF) during server render and passes them in.
 * The only local state is the ephemeral search query — a client-side filter over the
 * server-provided list by name or phone — so the server stays the single source of
 * truth. Each customer keeps its rank in the full spend ranking (captured before
 * filtering), so a searched-down list still shows each one's true position.
 */
export function CustomersScreen({ customers }: CustomersScreenProps) {
  const t = useTranslations("dashCustomers");
  const [query, setQuery] = React.useState("");
  const count = customers.length;

  // Number every customer by their position in the full spend ranking once, up front,
  // so filtering never renumbers the rows.
  const ranked = React.useMemo(
    () => customers.map((customer, index) => ({ customer, rank: index + 1 })),
    [customers],
  );

  const trimmed = query.trim();
  const visible = React.useMemo(() => {
    const needle = trimmed.toLowerCase();
    if (!needle) return ranked;
    return ranked.filter(({ customer }) =>
      `${customer.name} ${customer.phone}`.toLowerCase().includes(needle),
    );
  }, [ranked, trimmed]);

  const isEmpty = count === 0;
  const noMatches = !isEmpty && visible.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-heading-h2 text-foreground">{t("heading")}</h1>
        <p className="text-body-b6 text-muted-foreground">{t("summary", { count })}</p>
      </div>

      {!isEmpty && (
        <Input
          type="search"
          variant="filled"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          autoComplete="off"
          leftElement={<Icon icon={Search} size="sm" />}
          className="max-w-sm"
        />
      )}

      {isEmpty || noMatches ? (
        <div className="rounded-card-lg border border-dashed border-border px-6 py-16 text-center">
          <p className="text-body-b4 text-foreground">
            {isEmpty ? t("emptyTitle") : t("noResultsTitle")}
          </p>
          <p className="mt-1 text-body-b6 text-muted-foreground">
            {isEmpty ? t("emptyBody") : t("noResultsBody", { query: trimmed })}
          </p>
        </div>
      ) : (
        <CustomersTable rows={visible} />
      )}
    </div>
  );
}
