"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import { usePathname, useRouter } from "@/src/i18n/navigation";
import { ApiError } from "@/src/lib/api/ApiError";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { formatMoney } from "@/src/lib/formatMoney";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { Button, FormMessage } from "@/src/presentation/design-system";
import { addMoney } from "@/src/shared/assets/images";

import { NumericKeypad } from "./components";
import { walletsApi } from "./wallet-api";

const MAX_DIGITS = 6;

export default function AddMoneyScreen() {
  const t = useTranslations("wallet");
  const tApiErrors = useTranslations("apiErrors");
  const locale = useLocale();
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
      setError(t("errZero"));
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
        setError(localizeApiError(caught, tApiErrors, t("errGeneric")));
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

          <p className="text-center text-body-b4 text-foreground">{t("addMoneyIntro")}</p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4 rounded-card-xl bg-surface p-4">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-body-b7 text-muted-foreground">{t("addToWallet")}</span>
              <span className="truncate text-body-b4 text-foreground">{formatMoney(Number(amount) || 0, locale)}</span>
            </div>
            <Button type="button" size="sm" onClick={handleContinue} disabled={pending}>
              {t("continue")}
            </Button>
          </div>
          {error && (
            <FormMessage>{error}</FormMessage>
          )}
        </div>
      </div>

      <div className="px-4 pb-6 pt-3">
        <NumericKeypad onDigit={handleDigit} onBackspace={handleBackspace} />
      </div>
    </div>
  );
}
