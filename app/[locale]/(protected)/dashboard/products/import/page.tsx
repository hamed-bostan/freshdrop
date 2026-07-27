import { ProductImportPanel } from "@/src/presentation/dashboard/imports/ProductImportPanel";
import { requirePermission } from "@/src/lib/require-permission";

export const dynamic = "force-dynamic";

export default async function ImportProductsPage() {
  // Bulk-creating/updating the catalog is squarely a catalog write — same gate
  // as the single-product form.
  await requirePermission("catalog.write");

  return <ProductImportPanel />;
}
