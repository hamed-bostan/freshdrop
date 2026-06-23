"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Ticket } from "lucide-react";
import type { PromoCode } from "@/src/domain/entities/PromoCode";
import { Button, Icon, Input } from "@/src/presentation/design-system";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { PromoCodeOption } from "./components/PromoCodeOption";

interface PromoCodeScreenProps {
  promos: PromoCode[];
  /** Code already applied to the cart (highlighted in the list). */
  appliedCode: string | null;
}

export default function PromoCodeScreen({ promos, appliedCode }: PromoCodeScreenProps) {
  const router = useRouter();
  const [code, setCode] = React.useState("");

  // Applying a promo deep-links back to the cart, where it's resolved and the
  // discount is reflected in the total + checkout summary.
  const apply = (value: string) => {
    const trimmed = value.trim();
    if (trimmed) router.push(`/cart?promo=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="flex min-h-dvh flex-col gap-6 px-6 pb-6">
      <PageHeader title="Checkout" />

      <form
        className="flex items-center gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          apply(code);
        }}
      >
        <Input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Enter Promo Code"
          aria-label="Promo code"
          leftElement={<Icon icon={Ticket} size="md" />}
          size="lg"
        />
        <Button type="submit" iconOnly variant="outline" size="lg" aria-label="Apply promo code">
          <Icon icon={Plus} />
        </Button>
      </form>

      <ul className="flex flex-col gap-3">
        {promos.map((promo) => (
          <li key={promo.id}>
            <PromoCodeOption
              promo={promo}
              selected={promo.code === appliedCode}
              onSelect={apply}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
