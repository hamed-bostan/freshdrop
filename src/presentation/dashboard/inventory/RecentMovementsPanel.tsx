import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import type { Product } from "@/src/domain/entities/Product";
import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { DataTable, Thumbnail } from "@/src/presentation/design-system";
import type { StockMovementEntry } from "@/src/presentation/dashboard/products/stock-movement-response-schema";
import { formatNumber } from "@/src/lib/formatNumber";
import { formatRelativeTime } from "@/src/lib/formatRelativeTime";

type RecentMovementsPanelProps = {
  /** The store's most recent movements across every product, newest first. */
  movements: StockMovementEntry[];
  /** The products those movements name — for the thumbnail, name and edit link each row leads to. */
  products: Product[];
};

/**
 * `StockMovementHistory`'s counterpart for the whole store rather than one
 * product: the same read-only, append-only ledger, with a product identified on
 * every row instead of implied by the page it's embedded in.
 *
 * A movement whose product has since been deleted still renders — the row falls
 * back to a plain label instead of a link, the same "the history stays truthful"
 * rule the per-product panel follows for a renamed or removed actor.
 */
export async function RecentMovementsPanel({ movements, products }: RecentMovementsPanelProps) {
  const t = await getTranslations("dashInventory");
  const tProducts = await getTranslations("dashProducts");
  const locale = (await getLocale()) as Locale;

  const productsById = new Map(products.map((product) => [product.id, product]));

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-body-b4 text-foreground">{t("movementsHeading")}</h2>
        <p className="text-body-b6 text-muted-foreground">{t("movementsDescription")}</p>
      </div>

      {movements.length === 0 ? (
        <p className="rounded-card-lg border border-dashed border-border px-6 py-10 text-center text-body-b6 text-muted-foreground">
          {t("movementsEmpty")}
        </p>
      ) : (
        <DataTable>
          <ol className="divide-y divide-border">
            {movements.map((movement) => {
              const product = productsById.get(movement.productId);
              const added = movement.delta > 0;
              return (
                <li key={movement.id} className="flex flex-col gap-2 bg-background px-4 py-3">
                  <div className="flex items-center gap-3">
                    {product ? (
                      <>
                        <Thumbnail className="size-8 shrink-0">
                          <Image
                            src={product.imageUrl}
                            alt=""
                            width={32}
                            height={32}
                            className="size-full object-cover"
                          />
                        </Thumbnail>
                        <Link
                          href={`/dashboard/products/${product.id}/edit`}
                          className="min-w-0 flex-1 truncate text-body-b7 text-foreground hover:underline"
                        >
                          {product.name}
                        </Link>
                      </>
                    ) : (
                      <span className="min-w-0 flex-1 truncate text-body-b7 text-muted-foreground">
                        {t("movementsUnknownProduct")}
                      </span>
                    )}
                    <time dateTime={movement.at} className="shrink-0 text-body-b10 text-muted-foreground">
                      {formatRelativeTime(movement.at, locale)}
                    </time>
                  </div>

                  <p className="text-body-b8 text-muted-foreground">
                    <span
                      dir="ltr"
                      className={added ? "text-body-b7 text-success-foreground" : "text-body-b7 text-destructive"}
                    >
                      {added ? "+" : "−"}
                      {formatNumber(Math.abs(movement.delta), locale)}
                    </span>{" "}
                    <span className="text-foreground">{tProducts(`adjustReason.${movement.reason}`)}</span>
                    <span className="ms-2">
                      {movement.orderId ? (
                        <Link href={`/dashboard/orders/${movement.orderId}`} className="text-primary hover:underline">
                          {tProducts("historyByOrder")}
                        </Link>
                      ) : (
                        tProducts("historyByActor", { actor: movement.actorName ?? tProducts("historyUnknownActor") })
                      )}
                    </span>
                  </p>
                </li>
              );
            })}
          </ol>
        </DataTable>
      )}
    </section>
  );
}
