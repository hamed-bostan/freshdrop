import type { Product } from "@/src/domain/entities/Product";
import type { IProductRepository, NewProduct } from "@/src/domain/repositories/IProductRepository";

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

  async getSimilar(productId: string): Promise<Product[]> {
    const res = await fetch(`${this.baseUrl}/products/${productId}/similar`);
    return res.json();
  }

  async create(input: NewProduct): Promise<Product> {
    const res = await fetch(`${this.baseUrl}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return res.json();
  }

  async update(id: string, input: NewProduct): Promise<Product> {
    const res = await fetch(`${this.baseUrl}/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return res.json();
  }

  async delete(id: string): Promise<void> {
    await fetch(`${this.baseUrl}/products/${id}`, { method: "DELETE" });
  }
}
