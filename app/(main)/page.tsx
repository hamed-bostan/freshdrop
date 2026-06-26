import { GetFeaturedProducts } from "@/src/domain/use-cases/products/GetFeaturedProducts";
import { GetSpecialOffers } from "@/src/domain/use-cases/products/GetSpecialOffers";
import { GetCategories } from "@/src/domain/use-cases/categories/GetCategories";
import { GetDeliveryLocations } from "@/src/domain/use-cases/delivery-locations/GetDeliveryLocations";
import { productRepository, categoryRepository, deliveryLocationRepository } from "@/src/infrastructure/container";
import HomeScreen from "@/src/presentation/home/HomeScreen";

// Categories come from Postgres at request time — render dynamically (no DB at build).
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featuredProducts, specialOffers, categories, deliveryLocations] = await Promise.all([
    new GetFeaturedProducts(productRepository).execute(),
    new GetSpecialOffers(productRepository).execute(),
    new GetCategories(categoryRepository).execute(),
    new GetDeliveryLocations(deliveryLocationRepository).execute(),
  ]);

  return (
    <HomeScreen
      categories={categories}
      featuredProducts={featuredProducts}
      specialOffers={specialOffers}
      deliveryLocations={deliveryLocations}
    />
  );
}
