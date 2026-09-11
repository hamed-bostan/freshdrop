import { getTranslations } from "next-intl/server";

import type { AdminProductFilters } from "@/src/domain/entities/AdminProductFilters";
import type { Category } from "@/src/domain/entities/Category";
import type { Page } from "@/src/domain/entities/Pagination";
import type { Product } from "@/src/domain/entities/Product";
import type { StockMovementFilters } from "@/src/domain/entities/StockMovement";
import type { StockMovementEntry } from "@/src/presentation/dashboard/products/stock-movement-response-schema";

import { InventoryMovementsView } from "./InventoryMovementsView";
import { InventoryProductsView } from "./InventoryProductsView";
import { InventoryTabs, type InventoryView } from "./InventoryTabs";

type ProductInventoryData = {
  view: Extract<InventoryView, "restock" | "all">;
  products: Page<Product>;
  categories: Category[];
  filters: AdminProductFilters;
};

type MovementInventoryData = {
  view: "movements";
  movements: Page<StockMovementEntry>;
  movementProducts: Product[];
  movementFilters: StockMovementFilters;
};

type InventoryScreenProps = {
  canWrite: boolean;
  data: ProductInventoryData | MovementInventoryData;
};

/** Inventory workspace composed of three URL-backed operational projections. */
export async function InventoryScreen({ canWrite, data }: InventoryScreenProps) {
  const t = await getTranslations("dashInventory");

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
      <div>
        <h1 className="dashboard-page-title">{t("heading")}</h1>
        <p className="mt-1 max-w-2xl text-body-b6 leading-relaxed text-muted-foreground">{t("summary")}</p>
      </div>

      <InventoryTabs view={data.view} canViewMovements={canWrite} />

      {data.view === "movements" ? (
        <InventoryMovementsView
          movements={data.movements}
          products={data.movementProducts}
          filters={data.movementFilters}
        />
      ) : (
        <InventoryProductsView
          view={data.view}
          products={data.products}
          categories={data.categories}
          filters={data.filters}
          canWrite={canWrite}
        />
      )}
    </div>
  );
}
