import { notFound } from "next/navigation";

import { requirePermission } from "@/src/lib/require-permission";
import { EditPromoCodeScreen } from "@/src/presentation/dashboard/promo-codes/EditPromoCodeScreen";
import { promoCodesServerApi } from "@/src/presentation/dashboard/promo-codes/promo-code-server-api";

type EditPromoCodePageProps = {
  params: Promise<{ id: string }>;
};

// The campaign is fetched over the REST API (BFF) during server render; a missing
// one renders the not-found boundary. The screen is presentational from there.
export const dynamic = "force-dynamic";

export default async function EditPromoCodePage({ params }: EditPromoCodePageProps) {
  // The layout only gates on `dashboard.view`; this whole section is a write
  // surface, so anyone without the permission is redirected rather than shown a
  // page whose every read would 401.
  await requirePermission("promotions.write");

  const { id } = await params;
  const promoCode = await promoCodesServerApi.getById(id);
  if (!promoCode) notFound();

  return <EditPromoCodeScreen promoCode={promoCode} />;
}
