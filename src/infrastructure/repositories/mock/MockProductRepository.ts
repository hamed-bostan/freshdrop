import type { Product } from "@/src/domain/entities/Product";
import type { IProductRepository } from "@/src/domain/repositories/IProductRepository";

const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Fage Total Greek Yogurt",
    price: 2.56,
    rating: 4.5,
    ratingCount: 1,
    imageUrl: "/images/productImage-19.png",
    categoryId: "2",
    isFeatured: true,
  },
  {
    id: "2",
    name: "Organic Baby Spinach",
    price: 4.96,
    rating: 4.2,
    ratingCount: 1,
    imageUrl: "/images/productImage-20.png",
    categoryId: "1",
    isFeatured: true,
  },
  {
    id: "3",
    name: "Norwegian Salmon 1KG",
    price: 2.27,
    originalPrice: 2.5,
    discountPercent: 9,
    rating: 4.8,
    ratingCount: 1,
    imageUrl: "/images/productImage-21.png",
    categoryId: "3",
    isFeatured: false,
    badge: "Buy 1, Get 1 Free",
  },
  {
    id: "4",
    name: "Chili Powder 45G",
    price: 3.31,
    originalPrice: 3.45,
    discountPercent: 4,
    rating: 4.1,
    ratingCount: 1,
    imageUrl: "/images/productImage-22.png",
    categoryId: "4",
    isFeatured: false,
    badge: "Buy 1, Get 1 Free",
  },
];

export class MockProductRepository implements IProductRepository {
  async getAll(): Promise<Product[]> {
    return PRODUCTS;
  }

  async getById(id: string): Promise<Product | null> {
    return PRODUCTS.find((p) => p.id === id) ?? null;
  }

  async getFeatured(): Promise<Product[]> {
    return PRODUCTS.filter((p) => p.isFeatured);
  }

  async getByCategory(categoryId: string): Promise<Product[]> {
    return PRODUCTS.filter((p) => p.categoryId === categoryId);
  }

  async getSpecialOffers(): Promise<Product[]> {
    return PRODUCTS.filter((p) => p.badge != null);
  }
}
