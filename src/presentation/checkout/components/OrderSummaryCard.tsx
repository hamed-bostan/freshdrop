import { useTranslations } from "next-intl";
import type { CartItem } from "@/src/domain/entities/Cart";

interface OrderSummaryCardProps {
  items: CartItem[];
}

/** Read-only recap of the cart lines: product name + quantity, in a grey well. */
export function OrderSummaryCard({ items }: OrderSummaryCardProps) {
  const t = useTranslations("checkout");

  return (
    <ul className="flex w-full flex-col gap-2 rounded-card-xl bg-surface px-4 py-2">
      {items.map((item) => (
        <li key={item.product.id} className="flex items-center justify-between gap-4 text-body-b6">
          <span className="truncate text-foreground">{item.product.name}</span>
          <span className="shrink-0 text-muted-foreground">
            {t("itemCount", { count: item.quantity })}
          </span>
        </li>
      ))}
    </ul>
  );
}
