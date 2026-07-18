"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Button, FormMessage } from "@/src/presentation/design-system";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import type { PaymentMethod, PaymentMethodGroup } from "@/src/domain/entities/PaymentMethod";
import type { SavedCard } from "@/src/domain/entities/Wallet";
import { useRouter } from "@/src/i18n/navigation";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { paymentMethodsApi } from "./payment-method-api";
import { PaymentMethodOption, SavedCardOption, AddCardRow } from "./components";

/** Sections render in this fixed order; the title is a UI concern, not domain data. */
const SECTIONS: { group: PaymentMethodGroup; titleKey: "sectionCash" | "sectionWallet" | "sectionCard" | "sectionOptions" }[] = [
  { group: "cash", titleKey: "sectionCash" },
  { group: "wallet", titleKey: "sectionWallet" },
  { group: "card", titleKey: "sectionCard" },
  { group: "options", titleKey: "sectionOptions" },
];

interface PaymentMethodScreenProps {
  methods: PaymentMethod[];
  /** The user's saved cards, listed (and selectable) under the Credit Card section. */
  cards: SavedCard[];
  /**
   * The user's persisted checkout selection — a catalog option or saved card id, or
   * `null` when they haven't chosen one. Seeds the initial highlight so the screen
   * reopens on their current choice; a stale id simply matches nothing.
   */
  selectedId: string | null;
}

export default function PaymentMethodScreen({ methods, cards, selectedId }: PaymentMethodScreenProps) {
  const t = useTranslations("payment");
  const tApiErrors = useTranslations("apiErrors");
  const router = useRouter();
  const [selected, setSelected] = React.useState(() => selectedId ?? methods[0]?.id);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const handleConfirm = (event: React.FormEvent) => {
    event.preventDefault();
    // Nothing selectable yet (no options and no cards) — just step back.
    if (!selected) {
      router.back();
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await paymentMethodsApi.select(selected);
        // Persisted as the user's checkout selection — refresh the server tree so
        // checkout picks it up, then return to where they came from.
        router.refresh();
        router.back();
      } catch (err) {
        setError(localizeApiError(err, tApiErrors, t("saveError")));
      }
    });
  };

  return (
    <form onSubmit={handleConfirm} className="flex min-h-dvh flex-col gap-6 px-6 pb-10">
      <PageHeader title={t("title")} />

      <fieldset className="flex flex-col gap-6">
        <legend className="sr-only">{t("selectLegend")}</legend>

        {SECTIONS.map(({ group, titleKey }) => {
          const groupMethods = methods.filter((method) => method.group === group);

          // The Credit Card section always shows the user's saved cards plus the
          // "Add Card" action, even when there are none; other empty sections are
          // omitted entirely.
          if (group !== "card" && groupMethods.length === 0) return null;

          return (
            <section key={group} className="flex flex-col gap-2">
              <h2 className="text-body-b8 text-foreground">{t(titleKey)}</h2>

              {groupMethods.map((method) => (
                <PaymentMethodOption
                  key={method.id}
                  method={method}
                  selected={method.id === selected}
                  onSelect={setSelected}
                />
              ))}

              {group === "card" &&
                cards.map((card) => (
                  <SavedCardOption
                    key={card.id}
                    card={card}
                    selected={card.id === selected}
                    onSelect={setSelected}
                  />
                ))}

              {group === "card" && <AddCardRow />}
            </section>
          );
        })}
      </fieldset>

      {error && (
        <FormMessage size="md" className="text-center">{error}</FormMessage>
      )}

      <Button type="submit" size="lg" disabled={pending} className="mt-auto w-full rounded-button-lg">
        {pending ? t("saving") : t("confirm")}
      </Button>
    </form>
  );
}
