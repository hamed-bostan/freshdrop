"use client";

import * as React from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CartItem } from "@/src/domain/entities/Cart";
import type { SubstitutionPreference } from "@/src/domain/entities/Order";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icon,
  Thumbnail,
} from "@/src/presentation/design-system";

type SubstitutionPreferenceListProps = {
  items: CartItem[];
  /** Per-product preference; a product absent from the map defaults to `substitute`. */
  value: Record<string, SubstitutionPreference>;
  onChange: (productId: string, preference: SubstitutionPreference) => void;
};

/** How many lines show before the list collapses behind "View all N items". */
const COLLAPSED_COUNT = 3;

const PREFERENCES: SubstitutionPreference[] = ["substitute", "refund", "contact"];

const PREFERENCE_LABEL_KEYS: Record<SubstitutionPreference, "replaceWith" | "refundIf" | "contactMe"> = {
  substitute: "replaceWith",
  refund: "refundIf",
  contact: "contactMe",
};

/**
 * The order's line items with each one's out-of-stock pre-approval (the
 * grocery "substitutions" choice) and a "Change" affordance to pick from the
 * three preferences. Lines beyond {@link COLLAPSED_COUNT} start hidden behind
 * a "View all N items" toggle — the order recap and its preferences used to
 * be two separate lists; this is the merged, expandable one the review step
 * mockup shows.
 */
export function SubstitutionPreferenceList({ items, value, onChange }: SubstitutionPreferenceListProps) {
  const t = useTranslations("checkout");
  const [expanded, setExpanded] = React.useState(false);
  const visibleItems = expanded ? items : items.slice(0, COLLAPSED_COUNT);
  const hiddenCount = items.length - COLLAPSED_COUNT;

  return (
    <div className="flex w-full flex-col gap-3 rounded-card-xl bg-surface px-4 py-3">
      <ul className="flex flex-col gap-3">
        {visibleItems.map((item) => {
          const preference = value[item.product.id] ?? "substitute";
          const switchId = `substitution-${item.product.id}`;

          return (
            <li key={item.product.id} className="flex items-center gap-3">
              <Thumbnail as="span" className="size-10">
                <Image
                  src={item.product.imageUrl}
                  alt=""
                  width={40}
                  height={40}
                  className="size-full object-contain"
                />
              </Thumbnail>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-body-b6 text-foreground">{item.product.name}</p>
                  <span className="shrink-0 text-body-b9 text-muted-foreground">
                    {t("itemCount", { count: item.quantity })}
                  </span>
                </div>
                <p id={switchId} className="text-body-b9 text-muted-foreground">
                  {t(PREFERENCE_LABEL_KEYS[preference])}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="shrink-0 text-body-b8 text-primary"
                    aria-labelledby={`${switchId} ${switchId}-change`}
                  >
                    <span id={`${switchId}-change`}>{t("change")}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {PREFERENCES.map((option) => (
                    <DropdownMenuItem
                      key={option}
                      onSelect={() => onChange(item.product.id, option)}
                      className="justify-between gap-4"
                    >
                      <span>{t(PREFERENCE_LABEL_KEYS[option])}</span>
                      {preference === option && <Icon icon={Check} size="sm" className="text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          );
        })}
      </ul>

      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="self-start text-body-b8 text-primary"
        >
          {expanded ? t("showLess") : t("viewAllItems", { count: items.length })}
        </button>
      )}
    </div>
  );
}
