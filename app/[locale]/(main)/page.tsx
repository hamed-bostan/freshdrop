import { categoriesServerApi } from "@/src/presentation/category/category-server-api";
import { productsServerApi } from "@/src/presentation/product/product-server-api";
import { deliveryLocationsServerApi } from "@/src/presentation/delivery-location/delivery-location-server-api";
import HomeScreen from "@/src/presentation/home/HomeScreen";

// All data is fetched from the REST API at request time (BFF) — render dynamically.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featuredProducts, specialOffers, categories, deliveryLocations] = await Promise.all([
    productsServerApi.listFeatured(),
    productsServerApi.listSpecialOffers(),
    categoriesServerApi.list(),
    deliveryLocationsServerApi.list(),
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
