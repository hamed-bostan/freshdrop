"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CreditCard, User, Lock } from "lucide-react";
import { Button, Icon, Input, PasswordInput, TextField } from "@/src/presentation/design-system";
import { PageHeader } from "@/src/presentation/components/PageHeader";

export default function AddCardScreen() {
  const router = useRouter();

  const [cardNumber, setCardNumber] = React.useState("");
  const [cardholder, setCardholder] = React.useState("");
  const [year, setYear] = React.useState("");
  const [month, setMonth] = React.useState("");
  const [cvv, setCvv] = React.useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // TODO: validate + persist via an AddPaymentCard use-case, then return to the
    // payment methods list. For now, just navigate back.
    router.push("/profile/payment-methods");
  };

  return (
    <form onSubmit={handleSubmit} className="flex min-h-dvh flex-col gap-4 px-6 pb-10">
      <PageHeader title="Add Card" />

      {/* Card number — maskable via the show/hide toggle PasswordInput provides. */}
      <TextField label="Card number">
        {(control) => (
          <PasswordInput
            {...control}
            size="lg"
            placeholder="card number"
            inputMode="numeric"
            autoComplete="cc-number"
            leftElement={<Icon icon={CreditCard} size="sm" />}
            value={cardNumber}
            onChange={(event) => setCardNumber(event.target.value)}
          />
        )}
      </TextField>

      <TextField
        label="Cardholder name"
        size="lg"
        placeholder="cardholder name"
        autoComplete="cc-name"
        leftElement={<Icon icon={User} size="sm" />}
        value={cardholder}
        onChange={(event) => setCardholder(event.target.value)}
      />

      {/* Two controls under one label → grouped for screen readers, each with its own name. */}
      <div role="group" aria-label="Expiry date" className="flex flex-col gap-1.5">
        <span className="text-body-b3 text-input-foreground">Expiry date</span>
        <div className="grid grid-cols-2 gap-4">
          <Input
            size="lg"
            placeholder="Year"
            aria-label="Expiry year"
            inputMode="numeric"
            autoComplete="cc-exp-year"
            maxLength={4}
            value={year}
            onChange={(event) => setYear(event.target.value)}
          />
          <Input
            size="lg"
            placeholder="Month"
            aria-label="Expiry month"
            inputMode="numeric"
            autoComplete="cc-exp-month"
            maxLength={2}
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          />
        </div>
      </div>

      <TextField label="Cvv">
        {(control) => (
          <PasswordInput
            {...control}
            size="lg"
            placeholder="cvv"
            inputMode="numeric"
            autoComplete="cc-csc"
            maxLength={4}
            leftElement={<Icon icon={Lock} size="sm" />}
            value={cvv}
            onChange={(event) => setCvv(event.target.value)}
          />
        )}
      </TextField>

      <Button type="submit" size="lg" className="mt-auto w-full">
        Add Card
      </Button>
    </form>
  );
}
