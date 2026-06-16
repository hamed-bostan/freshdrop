import type { Product } from "@/src/domain/entities/Product";
import type { IProductRepository } from "@/src/domain/repositories/IProductRepository";

export class ProductRepository implements IProductRepository {
  constructor(private readonly baseUrl: string) {}

  async getAll(): Promise<Product[]> {
    const res = await fetch(`${this.baseUrl}/products`);
    return res.json();
  }

  async getById(id: string): Promise<Product | null> {
    const res = await fetch(`${this.baseUrl}/products/${id}`);
    if (!res.ok) return null;
    return res.json();
  }

  async getFeatured(): Promise<Product[]> {
    const res = await fetch(`${this.baseUrl}/products?featured=true`);
    return res.json();
  }

  async getByCategory(categoryId: string): Promise<Product[]> {
    const res = await fetch(`${this.baseUrl}/products?categoryId=${categoryId}`);
    return res.json();
  }

  async getSpecialOffers(): Promise<Product[]> {
    const res = await fetch(`${this.baseUrl}/products?specialOffer=true`);
    return res.json();
  }
}
