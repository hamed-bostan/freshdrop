import { getTranslations } from "next-intl/server";
import type { Category } from "@/src/domain/entities/Category";
import type { Product } from "@/src/domain/entities/Product";
import type { DeliveryLocation } from "@/src/domain/entities/DeliveryLocation";
import { HomeHeader } from "./components/HomeHeader";
import { HeroBanner } from "./components/HeroBanner";
import { CategoryGrid } from "@/src/presentation/category/components";
import { FeaturedProducts } from "./components/FeaturedProducts";
import { SpecialOffers } from "./components/SpecialOffers";

interface HomeScreenProps {
  categories: Category[];
  featuredProducts: Product[];
  specialOffers: Product[];
  deliveryLocations: DeliveryLocation[];
}

export default async function HomeScreen({
  categories,
  featuredProducts,
  specialOffers,
  deliveryLocations,
}: HomeScreenProps) {
  const t = await getTranslations("home");

  return (
    <div className="flex flex-col gap-6 pb-24 px-6">
      <HomeHeader deliveryLocations={deliveryLocations} />
      <HeroBanner />
      <CategoryGrid categories={categories.slice(0, 6)} title={t("categorySection")} href="/category" />
      <FeaturedProducts products={featuredProducts} />
      <SpecialOffers products={specialOffers} />
    </div>
  );
}
