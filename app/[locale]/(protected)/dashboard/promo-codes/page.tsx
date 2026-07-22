import { PromoCodesScreen } from "@/src/presentation/dashboard/promo-codes/PromoCodesScreen";
import { promoCodesServerApi } from "@/src/presentation/dashboard/promo-codes/promo-code-server-api";
import { parseAdminPromoCodeFilters } from "@/src/lib/api/admin-promo-code-params";
import { toSearchParams } from "@/src/lib/api/searchParams";
import { requirePermission } from "@/src/lib/require-permission";

// Campaigns are fetched during server render over the REST API (BFF) and passed to
// the presentational screen. Search, filter and paging live in the query string, so
// changing any of them re-runs this fetch; mutations call router.refresh(). A failed
// fetch surfaces via the dashboard error boundary (error.tsx). The admin gate lives
// in the layout, and the BFF read forwards the admin's session cookie.
export const dynamic = "force-dynamic";

type DashboardPromoCodesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPromoCodesPage({ searchParams }: DashboardPromoCodesPageProps) {
  // The layout only gates on `dashboard.view`; this whole section is a write
  // surface, so anyone without the permission is redirected rather than shown a
  // page whose every read would 401.
  await requirePermission("promotions.write");

  const params = toSearchParams(await searchParams);
  const promoCodes = await promoCodesServerApi.listPage(params);

  return <PromoCodesScreen promoCodes={promoCodes} filters={parseAdminPromoCodeFilters(params)} />;
}
