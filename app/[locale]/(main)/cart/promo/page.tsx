import { promoCodesServerApi } from "@/src/presentation/cart/promo-code-server-api";
import PromoCodeScreen from "@/src/presentation/cart/PromoCodeScreen";

interface PromoPageProps {
  searchParams: Promise<{ applied?: string }>;
}

// Promo codes are fetched from the REST API at request time (BFF) — render dynamically.
export const dynamic = "force-dynamic";

export default async function PromoPage({ searchParams }: PromoPageProps) {
  const { applied } = await searchParams;

  const promos = await promoCodesServerApi.list();

  return <PromoCodeScreen promos={promos} appliedCode={applied ?? null} />;
}
