import { GetPromoCodes } from "@/src/domain/use-cases/promo-codes/GetPromoCodes";
import { promoCodeRepository } from "@/src/infrastructure/container";
import PromoCodeScreen from "@/src/presentation/cart/PromoCodeScreen";

interface PromoPageProps {
  searchParams: Promise<{ applied?: string }>;
}

export default async function PromoPage({ searchParams }: PromoPageProps) {
  const { applied } = await searchParams;

  const promos = await new GetPromoCodes(promoCodeRepository).execute();

  return <PromoCodeScreen promos={promos} appliedCode={applied ?? null} />;
}
