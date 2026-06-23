import { Star } from "lucide-react";
import { Icon } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";
import { AddToCartButton } from "./AddToCartButton";
import type { Product } from "@/src/domain/entities/Product";
import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const hasDiscount = product.originalPrice != null && product.discountPercent != null;

  return (
    <article className={cn("rounded-card-xl bg-surface py-2 relative overflow-hidden", className)}>
      <Image src={product.imageUrl} alt={product.name} width={100} height={100} className="mx-auto w-auto h-24 mb-2" />
      {product.badge && (
        <span className="absolute right-0 top-2 z-10 rounded-tl-lg rounded-bl-lg rounded-tr-xs rounded-br-none bg-primary p-1 text-label-l3 text-primary-foreground">
          {product.badge}
        </span>
      )}

      {/* Stretched link: this link's ::after covers the whole card, so the card
          navigates to the product while the +button (lifted with z-10) stays
          independently clickable. No redundant wrapper — the title IS the link. */}
      <Link
        href={`/product/${product.id}`}
        className="block px-2 mb-1 rounded-sm text-body-b13 text-foreground transition-colors hover:text-primary after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:ring focus-visible:ring-ring"
      >
        {product.name}
      </Link>

      <div className="flex items-center gap-1 px-2 mb-1">
        <Icon icon={Star} size="xs" className="fill-rating text-rating" />
        <span className="text-body-b8 text-foreground">{product.rating}</span>
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
        <div className="relative z-10">
          <AddToCartButton productId={product.id} />
        </div>
      </div>
    </article>
  );
}
