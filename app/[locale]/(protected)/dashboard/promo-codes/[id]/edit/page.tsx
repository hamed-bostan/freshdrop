import { notFound } from "next/navigation";
import { EditPromoCodeScreen } from "@/src/presentation/dashboard/promo-codes/EditPromoCodeScreen";
import { promoCodesServerApi } from "@/src/presentation/dashboard/promo-codes/promo-code-server-api";

type EditPromoCodePageProps = {
  params: Promise<{ id: string }>;
};

// The campaign is fetched over the REST API (BFF) during server render; a missing
// one renders the not-found boundary. The screen is presentational from there.
export const dynamic = "force-dynamic";

export default async function EditPromoCodePage({ params }: EditPromoCodePageProps) {
  const { id } = await params;
  const promoCode = await promoCodesServerApi.getById(id);
  if (!promoCode) notFound();

  return <EditPromoCodeScreen promoCode={promoCode} />;
}
