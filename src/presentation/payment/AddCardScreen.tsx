"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { CreditCard, User, Lock } from "lucide-react";
import { Button, Icon, Input, PasswordInput, TextField } from "@/src/presentation/design-system";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { ApiError } from "@/src/lib/api/ApiError";
import { walletsApi } from "@/src/presentation/wallet/wallet-api";

export default function AddCardScreen() {
  const router = useRouter();
  const pathname = usePathname();

  const [cardNumber, setCardNumber] = React.useState("");
  const [cardholder, setCardholder] = React.useState("");
  const [year, setYear] = React.useState("");
  const [month, setMonth] = React.useState("");
  const [cvv, setCvv] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        // The server derives the brand, masks the PAN and drops the CVV — we only
        // send the entered fields; it re-validates with the same schema.
        await walletsApi.addCard({
          number: cardNumber,
          holderName: cardholder,
          expiryMonth: month,
          expiryYear: year,
          cvv,
        });
        // Server is the source of truth — return to the list and re-render it.
        router.push("/profile/payment-methods");
        router.refresh();
      } catch (caught) {
        // Anonymous callers get a 401 — send them to login, returning here after.
        if (caught instanceof ApiError && caught.status === 401) {
          router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
          return;
        }
        setError(caught instanceof ApiError ? caught.message : "Something went wrong. Please try again.");
      }
    });
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

      {error && (
        <p role="alert" className="text-body-b10 text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="mt-auto w-full" disabled={pending}>
        Add Card
      </Button>
    </form>
  );
}
