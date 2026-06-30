"use client";

import * as React from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/src/presentation/design-system";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { ApiError } from "@/src/lib/api/ApiError";
import { addMoney } from "@/src/shared/assets/images";
import { walletsApi } from "./wallet-api";
import { NumericKeypad } from "./components";

const MAX_DIGITS = 6;

export default function AddMoneyScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const [amount, setAmount] = React.useState("240");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const handleDigit = (digit: string) =>
    setAmount((prev) => {
      // Replace a lone leading zero, then cap the length.
      const next = (prev === "0" ? "" : prev) + digit;
      return next.slice(0, MAX_DIGITS);
    });

  const handleBackspace = () => setAmount((prev) => prev.slice(0, -1));

  const handleContinue = () => {
    const value = Number(amount);
    if (!value) {
      setError("Enter an amount greater than zero.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await walletsApi.addFunds({ amount: value });
        // Server is the source of truth — return to the wallet and re-render it.
        router.push("/profile/wallet");
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
    <div className="flex min-h-dvh flex-col">
      <div className="flex flex-col gap-8 px-6 pb-14">
        <PageHeader />

        <div className="flex flex-col items-center justify-center gap-8">
          {/* Decorative — the headline below conveys the meaning. Design size 235×194. */}
          <Image src={addMoney} alt="" sizes="235px" className="h-auto w-full max-w-58.75" />

          <p className="text-center text-body-b4 text-foreground">
            Use Credit Card To Add Money To Use Your Wallet For Quick Use.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4 rounded-card-xl bg-surface p-4">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-body-b7 text-muted-foreground">Add Money to Wallet</span>
              <span className="truncate text-body-b4 text-foreground">${amount || "0"}</span>
            </div>
            <Button type="button" size="sm" onClick={handleContinue} disabled={pending}>
              Continue
            </Button>
          </div>
          {error && (
            <p role="alert" className="text-body-b10 text-destructive">
              {error}
            </p>
          )}
        </div>
      </div>

      <div className="px-4 pb-6 pt-3">
        <NumericKeypad onDigit={handleDigit} onBackspace={handleBackspace} />
      </div>
    </div>
  );
}
