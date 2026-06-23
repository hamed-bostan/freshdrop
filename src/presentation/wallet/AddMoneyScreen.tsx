"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@/src/presentation/design-system";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { addMoney } from "@/src/shared/assets/images";
import { NumericKeypad } from "./components";

const MAX_DIGITS = 6;

export default function AddMoneyScreen() {
  const [amount, setAmount] = React.useState("240");

  const handleDigit = (digit: string) =>
    setAmount((prev) => {
      // Replace a lone leading zero, then cap the length.
      const next = (prev === "0" ? "" : prev) + digit;
      return next.slice(0, MAX_DIGITS);
    });

  const handleBackspace = () => setAmount((prev) => prev.slice(0, -1));

  const handleContinue = () => {
    // TODO: proceed to confirm/charge the amount via an AddMoney use-case.
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

        <div className="flex items-center justify-between gap-4 rounded-card-xl bg-surface p-4">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-body-b7 text-muted-foreground">Add Money to Wallet</span>
            <span className="truncate text-body-b4 text-foreground">${amount || "0"}</span>
          </div>
          <Button type="button" size="sm" onClick={handleContinue}>
            Continue
          </Button>
        </div>
      </div>

      <div className="px-4 pb-6 pt-3">
        <NumericKeypad onDigit={handleDigit} onBackspace={handleBackspace} />
      </div>
    </div>
  );
}
