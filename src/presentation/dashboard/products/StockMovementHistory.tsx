import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/src/i18n/routing";
import { Link } from "@/src/i18n/navigation";
import { DataTable } from "@/src/presentation/design-system";
import { formatNumber } from "@/src/lib/formatNumber";
import { formatRelativeTime } from "@/src/lib/formatRelativeTime";
import type { StockMovementEntry } from "./stock-movement-response-schema";

type StockMovementHistoryProps = {
  /** The product's recent movements, newest first. */
  movements: StockMovementEntry[];
};

/**
 * The stock ledger for one product: what moved, why, and who to attribute it to.
 *
 * Read-only and append-only — there is deliberately nothing here to edit or clear.
 * A history an admin can quietly tidy up isn't one, and this is the record that
 * answers "where did forty units go", which is only worth asking if the answer
 * can't be rewritten.
 *
 * Attribution renders from the entry itself: an operator's adjustment shows the
 * name captured at the time (so a rename or a deleted account doesn't rewrite the
 * past), while an order-driven movement links to the order that caused it.
 */
export async function StockMovementHistory({ movements }: StockMovementHistoryProps) {
  const t = await getTranslations("dashProducts");
  const locale = (await getLocale()) as Locale;

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-body-b4 text-foreground">{t("historyHeading")}</h2>
        <p className="text-body-b6 text-muted-foreground">{t("historyDescription")}</p>
      </div>

      {movements.length === 0 ? (
        <p className="rounded-card-lg border border-dashed border-border px-6 py-10 text-center text-body-b6 text-muted-foreground">
          {t("historyEmpty")}
        </p>
      ) : (
        // The same card frame the admin tables sit in; the rows inside are an
        // ordered list rather than a table — a movement is one sentence, not
        // columns (the same call `TeamActivity` makes for the access log).
        <DataTable>
          <ol className="divide-y divide-border">
            {movements.map((movement) => {
              const added = movement.delta > 0;
              return (
                <li key={movement.id} className="flex flex-col gap-1 bg-background px-4 py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="flex items-baseline gap-2">
                      {/* The sign is the first thing to read, so it carries the
                          colour: units gained read as success, units lost as a
                          warning worth noticing in a scan. `dir="ltr"` keeps the
                          sign in front of the digits under Persian. */}
                      <span
                        dir="ltr"
                        className={added ? "text-body-b5 text-success-foreground" : "text-body-b5 text-destructive"}
                      >
                        {added ? "+" : "−"}
                        {formatNumber(Math.abs(movement.delta), locale)}
                      </span>
                      <span className="text-body-b7 text-foreground">{t(`adjustReason.${movement.reason}`)}</span>
                    </span>
                    <time dateTime={movement.at} className="text-body-b10 text-muted-foreground">
                      {formatRelativeTime(movement.at, locale)}
                    </time>
                  </div>

                  <p className="text-body-b10 text-muted-foreground">
                    {/* Exactly one attribution is ever set (see `StockMovement`),
                        so this reads as one clause, not a list of maybes. */}
                    {movement.orderId ? (
                      <Link
                        href={`/dashboard/orders/${movement.orderId}`}
                        className="text-primary hover:underline"
                      >
                        {t("historyByOrder")}
                      </Link>
                    ) : (
                      t("historyByActor", { actor: movement.actorName ?? t("historyUnknownActor") })
                    )}
                    <span className="ms-2">
                      {t("historyRemaining", { count: formatNumber(movement.quantityAfter, locale) })}
                    </span>
                  </p>

                  {movement.note && <p className="text-body-b10 text-foreground">{movement.note}</p>}
                </li>
              );
            })}
          </ol>
        </DataTable>
      )}
    </section>
  );
}
