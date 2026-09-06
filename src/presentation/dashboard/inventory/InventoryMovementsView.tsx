
import { getTranslations } from "next-intl/server";

import type { Page } from "@/src/domain/entities/Pagination";
import type { Product } from "@/src/domain/entities/Product";
import type { StockMovementFilters } from "@/src/domain/entities/StockMovement";
import { ExportCsvLink } from "@/src/presentation/dashboard/analytics/ExportCsvLink";
import { ListPager, ListSearchInput } from "@/src/presentation/dashboard/list";
import type { StockMovementEntry } from "@/src/presentation/dashboard/products/stock-movement-response-schema";

import styles from "./inventory.module.css";
import { InventoryMovementFilters } from "./InventoryMovementFilters";
import { InventoryMovementsTable } from "./InventoryMovementsTable";

type InventoryMovementsViewProps = {
  movements: Page<StockMovementEntry>;
  products: Product[];
  filters: StockMovementFilters;
};

/** Store-wide stock ledger: searchable, filterable, pageable, exportable, and immutable. */
export async function InventoryMovementsView({
  movements,
  products,
  filters,
}: InventoryMovementsViewProps) {
  const t = await getTranslations("dashInventory");
  const tList = await getTranslations("dashList");
  const isFiltered = Boolean(
    filters.query || filters.direction || filters.reason || filters.occurredFrom || filters.occurredTo,
  );
  const toolbar = (
    <div className={styles.movementToolbar}>
      <div className={styles.movementControls}>
        <div className={styles.movementSearch}>
          <ListSearchInput label={t("movementSearchLabel")} placeholder={t("movementSearchPlaceholder")} className="max-w-none sm:max-w-none" />
        </div>
        <div className={styles.movementFilters}>
          <InventoryMovementFilters />
        </div>
        <div className={styles.movementExport}>
          <ExportCsvLink resource="inventory-movements" label={t("exportCsv")} />
        </div>
      </div>
    </div>
  );

  if (movements.items.length === 0) {
    return (
      <>
        {toolbar}
        <div className="rounded-card-lg border border-dashed border-border px-6 py-16 text-center">
          <p className="text-body-b4 text-foreground">
            {isFiltered ? tList("noResultsTitle") : t("movementsEmpty")}
          </p>
          <p className="mt-1 text-body-b6 text-muted-foreground">
            {isFiltered ? tList("noResultsBody") : t("movementsEmptyBody")}
          </p>
        </div>
      </>
    );
  }

  return (
    <InventoryMovementsTable
      movements={movements.items}
      products={products}
      toolbar={toolbar}
      footer={<ListPager page={movements} />}
    />
  );
}
