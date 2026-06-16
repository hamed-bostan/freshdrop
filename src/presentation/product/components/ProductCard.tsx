import { Star } from "lucide-react";
import { Icon } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";
import { AddToCartButton } from "./AddToCartButton";
import type { Product } from "@/src/domain/entities/Product";
import Image from "next/image";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const hasDiscount = product.originalPrice != null && product.discountPercent != null;

  return (
    <article className={cn("rounded-card-xl bg-card py-2 relative overflow-hidden", className)}>
      <Image src={product.imageUrl} alt={product.name} width={100} height={100} className="mx-auto w-auto h-24 mb-2" />
      {product.badge && (
        <span className="absolute right-0 top-2 z-10 rounded-tl-lg rounded-bl-lg rounded-tr-xs rounded-br-none bg-primary p-1 text-label-l3 text-primary-foreground">
          {product.badge}
        </span>
      )}

      <p className="text-body-b13 text-foreground px-2 mb-1">{product.name}</p>

      <div className="flex items-center gap-1 px-2 mb-1">
        <Icon icon={Star} size="xs" className="fill-[#FFC107] text-[#FFC107]" />
        <span className="text-body-b8 text-foreground">{product.ratingCount}</span>
      </div>

      <div className="flex justify-between items-center px-2">
        <div className="flex flex-col">
          <span className="text-base font-bold text-foreground">${product.price.toFixed(2)}</span>
          {hasDiscount && (
            <div className="flex items-center gap-1">
              <span className="rounded-full size-4 bg-discount flex items-center justify-center text-[0.5rem] font-semibold text-primary-foreground">
                {product.discountPercent}%
              </span>
              <span className="text-body-b11 font-bold text-muted-foreground line-through">
                ${product.originalPrice!.toFixed(2)}
              </span>
            </div>
          )}
        </div>
        <AddToCartButton productId={product.id} />
      </div>
    </article>
  );
}
