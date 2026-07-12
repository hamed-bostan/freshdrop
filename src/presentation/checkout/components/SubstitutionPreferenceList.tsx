"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { CartItem } from "@/src/domain/entities/Cart";
import type { SubstitutionPreference } from "@/src/domain/entities/Order";
import { Switch } from "@/src/presentation/design-system";

type SubstitutionPreferenceListProps = {
  items: CartItem[];
  /** Per-product preference; a product absent from the map defaults to `substitute`. */
  value: Record<string, SubstitutionPreference>;
  onChange: (productId: string, preference: SubstitutionPreference) => void;
};

/**
 * Per-line out-of-stock pre-approval for checkout — the grocery "substitutions"
 * choice. Each item defaults to allowing a comparable replacement (the grocery
 * norm); toggling off asks for a refund instead if the picker can't find it. The
 * choices are lifted to the checkout screen and sent with the order.
 */
export function SubstitutionPreferenceList({ items, value, onChange }: SubstitutionPreferenceListProps) {
  const t = useTranslations("checkout");

  return (
    <ul className="flex w-full flex-col gap-3 rounded-card-xl bg-surface px-4 py-3">
      {items.map((item) => {
        const preference = value[item.product.id] ?? "substitute";
        const allowSubstitute = preference === "substitute";
        const switchId = `substitution-${item.product.id}`;

        return (
          <li key={item.product.id} className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-card-md bg-surface-sunken">
              <Image
                src={item.product.imageUrl}
                alt=""
                width={40}
                height={40}
                className="size-full object-contain"
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-b6 text-foreground">{item.product.name}</p>
              <label htmlFor={switchId} className="text-body-b8 text-muted-foreground">
                {allowSubstitute ? t("replaceWith") : t("refundIf")}
              </label>
            </div>
            <Switch
              id={switchId}
              checked={allowSubstitute}
              onCheckedChange={(checked) =>
                onChange(item.product.id, checked ? "substitute" : "refund")
              }
              aria-label={t("subAria", { name: item.product.name })}
            />
          </li>
        );
      })}
    </ul>
  );
}
