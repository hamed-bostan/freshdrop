import Image from "next/image";
import { Plus, Trash2 } from "lucide-react";
import type { CartItem } from "@/src/domain/entities/Cart";
import { Icon } from "@/src/presentation/design-system";

interface CartItemCardProps {
  item: CartItem;
  onIncrement: () => void;
  onRemove: () => void;
}

/**
 * A single cart row: product thumbnail, name + short description, then a
 * price and a trash / quantity / add control. The mockup pairs a remove action
 * (trash) with an increment (＋) — there is no decrement, so the trash removes
 * the whole line.
 */
export function CartItemCard({ item, onIncrement, onRemove }: CartItemCardProps) {
  const { product, quantity } = item;
  const subtitle = product.description ?? product.unit;
  // Can't add past what's on hand — the server enforces the same cap, this just
  // reflects it so the ＋ can't be tapped into a guaranteed rejection.
  const atStockLimit = quantity >= product.stockQuantity;

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
            {product.stockQuantity > 0 ? "Max available in stock" : "Out of stock"}
          </p>
        )}

        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-body-b9 text-muted-foreground">${product.price.toFixed(2)}</span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${product.name} from cart`}
              className="grid size-8 place-items-center rounded-full text-destructive transition-colors active:bg-error"
            >
              <Icon icon={Trash2} size="sm" />
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
              aria-label={`Increase ${product.name} quantity`}
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
