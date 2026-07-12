import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem } from "@/src/domain/entities/Cart";
import { Icon } from "@/src/presentation/design-system";
import { formatMoney } from "@/src/lib/formatMoney";

interface CartItemCardProps {
  item: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

/**
 * A single cart row: product thumbnail, name + short description, then a
 * price and a trash / − / quantity / ＋ control. The − steps the line down to a
 * floor of one; clearing the line entirely goes through the trash (which asks
 * for confirmation), so − is disabled at a quantity of one.
 */
export function CartItemCard({ item, onIncrement, onDecrement, onRemove }: CartItemCardProps) {
  const t = useTranslations("cart");
  const locale = useLocale();
  const { product, quantity } = item;
  const subtitle = product.description ?? product.unit;
  // Can't add past what's on hand — the server enforces the same cap, this just
  // reflects it so the ＋ can't be tapped into a guaranteed rejection.
  const atStockLimit = quantity >= product.stockQuantity;
  // − floors at one; the trash (with its confirmation) clears the whole line.
  const atMinQuantity = quantity <= 1;

  return (
    <article className="flex items-center gap-3 rounded-card-xl bg-surface p-3">
        <Image
          src={product.imageUrl}
          alt={product.name}
          width={70}
          height={70}
          className="object-contain"
        />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="truncate text-body-b4 text-foreground">{product.name}</h2>
        {subtitle && <p className="truncate text-body-b6 text-muted-foreground">{subtitle}</p>}
        {atStockLimit && (
          <p className="text-body-b10 text-warning-foreground">
            {product.stockQuantity > 0 ? t("maxInStock") : t("outOfStock")}
          </p>
        )}

        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-body-b9 text-muted-foreground">{formatMoney(product.price, locale)}</span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRemove}
              aria-label={t("removeAria", { name: product.name })}
              className="grid size-8 place-items-center rounded-full text-destructive transition-colors active:bg-error"
            >
              <Icon icon={Trash2} size="sm" />
            </button>

            <button
              type="button"
              onClick={onDecrement}
              disabled={atMinQuantity}
              aria-label={t("decreaseAria", { name: product.name })}
              className="grid size-8 place-items-center rounded-full text-primary transition-colors active:bg-accent disabled:text-disabled-foreground disabled:active:bg-transparent"
            >
              <Icon icon={Minus} size="sm" />
            </button>

            <span
              aria-live="polite"
              className="grid h-11 min-w-11 place-items-center rounded-card-xl bg-background text-body-b4 text-foreground"
            >
              {quantity}
            </span>

            <button
              type="button"
              onClick={onIncrement}
              disabled={atStockLimit}
              aria-label={t("increaseAria", { name: product.name })}
              className="grid size-8 place-items-center rounded-full text-primary transition-colors active:bg-accent disabled:text-disabled-foreground disabled:active:bg-transparent"
            >
              <Icon icon={Plus} size="sm" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
