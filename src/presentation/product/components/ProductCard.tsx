import { useLocale, useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { Icon } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";
import { formatMoney } from "@/src/lib/formatMoney";
import { CartQuantityControl } from "./CartQuantityControl";
import { FavoriteToggle } from "./FavoriteToggle";
import type { Product } from "@/src/domain/entities/Product";
import { getStockStatus } from "@/src/domain/entities/stock";
import Image from "next/image";
import { Link } from "@/src/i18n/navigation";

interface ProductCardProps {
  product: Product;
  className?: string;
  /** Show only the "Add" button (no − / ＋ stepper) — see {@link CartQuantityControl}. */
  addOnly?: boolean;
  /**
   * Show a favorite heart toggle in the corner, seeded with {@link initialFavorite}.
   * Used on the favorites grid and the product-detail "similar" row.
   */
  favoriteToggle?: boolean;
  /** Seeds the heart's filled state when {@link favoriteToggle} is on; resolved server-side. */
  initialFavorite?: boolean;
  /** In a favorites list, drop the card on un-favorite instead of toggling in place — see {@link FavoriteToggle}. */
  refreshOnUnfavorite?: boolean;
}

export function ProductCard({
  product,
  className,
  addOnly = false,
  favoriteToggle = false,
  initialFavorite = false,
  refreshOnUnfavorite = false,
}: ProductCardProps) {
  const t = useTranslations("product");
  const locale = useLocale();
  const hasDiscount = product.originalPrice != null && product.discountPercent != null;
  const stock = getStockStatus(product.stockQuantity);
  const outOfStock = stock.level === "out";

  return (
    <article className={cn("rounded-card-xl bg-surface py-2 relative overflow-hidden", className)}>
      {/* Top-left so it clears the badge / out-of-stock ribbon on the right; z-10 to
          stay clickable above the title's stretched link overlay. */}
      {favoriteToggle && (
        <FavoriteToggle
          productId={product.id}
          productName={product.name}
          initialFavorite={initialFavorite}
          refreshOnUnfavorite={refreshOnUnfavorite}
          className="absolute start-2 top-2 z-10"
        />
      )}

      <Image
        src={product.imageUrl}
        alt={product.name}
        width={100}
        height={100}
        className={cn("mx-auto w-auto h-24 mb-2", outOfStock && "opacity-40 grayscale")}
      />
      {/* Out of stock takes the ribbon slot (it's the more important signal); an
          in-stock product still shows its promo badge there. */}
      {outOfStock ? (
        <span className="absolute end-0 top-2 z-10 rounded-ss-lg rounded-es-lg rounded-se-xs rounded-ee-none bg-destructive p-1 text-label-l3 text-destructive-foreground">
          {t("outOfStock")}
        </span>
      ) : (
        product.badge && (
          <span className="absolute end-0 top-2 z-10 rounded-ss-lg rounded-es-lg rounded-se-xs rounded-ee-none bg-primary p-1 text-label-l3 text-primary-foreground">
            {product.badge}
          </span>
        )
      )}

      {/* Stretched link: this link's ::after covers the whole card, so the card
          navigates to the product while the +button (lifted with z-10) stays
          independently clickable. No redundant wrapper — the title IS the link. */}
      <Link
        href={`/product/${product.id}`}
        className={cn(
          "block px-2 mb-1 rounded-sm text-body-b13 text-foreground transition-colors after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:ring focus-visible:ring-ring",
          !outOfStock && "hover:text-primary"
        )}
      >
        {product.name}
      </Link>

      {product.ratingCount > 0 && (
        <div className="flex items-center gap-1 px-2 mb-1">
          <Icon icon={Star} size="xs" className="fill-rating text-rating" />
          <span className="text-body-b8 text-foreground">{product.rating}</span>
        </div>
      )}

      {stock.level === "low" && (
        <p className="px-2 mb-1 text-body-b10 text-warning-foreground">{t("onlyLeft", { count: stock.quantity })}</p>
      )}

      <div className="flex justify-between items-center px-2">
        <div className="flex flex-col">
          <span className="text-base font-bold text-foreground">{formatMoney(product.price, locale)}</span>
          {hasDiscount && (
            <div className="flex items-center gap-1">
              <span className="rounded-full size-4 bg-discount flex items-center justify-center text-[0.5rem] font-semibold text-primary-foreground">
                {product.discountPercent}%
              </span>
              <span className="text-body-b11 font-bold text-muted-foreground line-through">
                {formatMoney(product.originalPrice!, locale)}
              </span>
            </div>
          )}
        </div>
        <div className="relative z-10">
          <CartQuantityControl product={product} disabled={outOfStock} addOnly={addOnly} />
        </div>
      </div>
    </article>
  );
}
