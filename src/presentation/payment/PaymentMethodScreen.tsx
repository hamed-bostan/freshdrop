"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/presentation/design-system";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import type { PaymentMethod, PaymentMethodGroup } from "@/src/domain/entities/PaymentMethod";
import { PaymentMethodOption, AddCardRow } from "./components";

/** Sections render in this fixed order; the title is a UI concern, not domain data. */
const SECTIONS: { group: PaymentMethodGroup; title: string }[] = [
  { group: "cash", title: "Cash" },
  { group: "wallet", title: "Wallet" },
  { group: "card", title: "Credit Card" },
  { group: "options", title: "Payment Options" },
];

interface PaymentMethodScreenProps {
  methods: PaymentMethod[];
}

export default function PaymentMethodScreen({ methods }: PaymentMethodScreenProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = React.useState(() => methods[0]?.id);

  const handleConfirm = (event: React.FormEvent) => {
    event.preventDefault();
    // TODO: persist `selectedId` (e.g. a SetDefaultPaymentMethod use-case) and/or
    // continue the checkout flow. For now we return to the previous screen.
    router.back();
  };

  return (
    <form onSubmit={handleConfirm} className="flex min-h-dvh flex-col gap-6 px-6 pb-10">
      <PageHeader title="Payment Method" />

      <fieldset className="flex flex-col gap-6">
        <legend className="sr-only">Select a payment method</legend>

        {SECTIONS.map(({ group, title }) => {
          const groupMethods = methods.filter((method) => method.group === group);

          // The Credit Card section always shows the "Add Card" action, even with
          // no saved cards; other empty sections are omitted entirely.
          if (group !== "card" && groupMethods.length === 0) return null;

          return (
            <section key={group} className="flex flex-col gap-2">
              <h2 className="text-body-b8 text-foreground">{title}</h2>

              {groupMethods.map((method) => (
                <PaymentMethodOption
                  key={method.id}
                  method={method}
                  selected={method.id === selectedId}
                  onSelect={setSelectedId}
                />
              ))}

              {group === "card" && <AddCardRow />}
            </section>
          );
        })}
      </fieldset>

      <Button type="submit" size="lg" className="mt-auto w-full rounded-2xl">
        Confirm Payment
      </Button>
    </form>
  );
}
