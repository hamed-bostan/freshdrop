export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  rating: number;
  ratingCount: number;
  imageUrl: string;
  categoryId: string;
  isFeatured: boolean;
  badge?: string;
}
