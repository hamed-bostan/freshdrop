import { getTranslations } from "next-intl/server";

import type { Product } from "@/src/domain/entities/Product";
import { SectionHeader } from "@/src/presentation/components/SectionHeader";
import { ProductGrid } from "@/src/presentation/product/components";

interface SpecialOffersProps {
  products: Product[];
}

export async function SpecialOffers({ products }: SpecialOffersProps) {
  const t = await getTranslations("home");

  return (
    <section aria-labelledby="special-offers-heading">
      <SectionHeader
        id="special-offers-heading"
        title={t("specialOffers")}
        href="/products/special-offers"
        className="mb-4"
      />
      <ProductGrid products={products} addOnly />
    </section>
  );
}
