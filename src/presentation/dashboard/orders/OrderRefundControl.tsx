"use client";

import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import type { Order } from "@/src/domain/entities/Order";
import { refundableRemaining } from "@/src/domain/entities/Refund";
import { useRouter } from "@/src/i18n/navigation";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { formatMoney } from "@/src/lib/formatMoney";
import { Button, Checkbox, FormMessage, Input, Textarea } from "@/src/presentation/design-system";

import { ordersApi } from "./order-api";

type OrderRefundControlProps = {
  order: Order;
};

type Mode = "lines" | "amount";

/**
 * Discretionary refund control (phase 7) — the admin action for everything the
 * guarded return/cancel flows don't cover: a partial complaint, a goodwill
 * credit, a correction. Two modes: pick specific lines (and, for each, how many
 * of the units ordered), or enter a bare amount. Either way the server is the
 * one that enforces the cap — this only shows `remaining` so the admin isn't
 * guessing, and re-derives it live as lines are toggled so the button disables
 * before a doomed request is even sent.
 *
 * Hidden once nothing is left to refund (`remaining <= 0`) — an order that's
 * already refunded in full has nothing this control could do.
 */
export function OrderRefundControl({ order }: OrderRefundControlProps) {
  const t = useTranslations("dashOrders");
  const tApiErrors = useTranslations("apiErrors");
  const locale = useLocale();
  const router = useRouter();

  const remaining = refundableRemaining(order.total, order.refunds);

  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<Mode>("lines");
  const [selected, setSelected] = React.useState<Record<string, number>>({});
  const [amount, setAmount] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  if (remaining <= 0) return null;

  function toggleLine(itemId: string, quantity: number, checked: boolean): void {
    setSelected((prev) => {
      const next = { ...prev };
      if (checked) next[itemId] = quantity;
      else delete next[itemId];
      return next;
    });
  }

  function setLineQuantity(itemId: string, quantity: number): void {
    setSelected((prev) => (itemId in prev ? { ...prev, [itemId]: quantity } : prev));
  }

  const linesChosen = Object.keys(selected).length > 0;
  const amountValue = Number(amount);
  const canSubmit =
    reason.trim() !== "" && (mode === "lines" ? linesChosen : amountValue > 0 && amountValue <= remaining);

  function submit(): void {
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      try {
        await ordersApi.issueRefund(order.id, {
          reason: reason.trim(),
          ...(mode === "lines"
            ? { lines: Object.entries(selected).map(([orderItemId, quantity]) => ({ orderItemId, quantity })) }
            : { amount: amountValue }),
        });
        setOpen(false);
        setSelected({});
        setAmount("");
        setReason("");
        router.refresh();
      } catch (err) {
        setError(localizeApiError(err, tApiErrors, t("refundIssueError")));
      }
    });
  }

  return (
    <section className="rounded-card-lg border border-border p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-body-b5 text-foreground">{t("refundHeading")}</h2>
          <p className="mt-1 text-body-b7 text-muted-foreground">
            {t("refundRemaining", { amount: formatMoney(remaining, locale) })}
          </p>
        </div>
        {!open && (
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
            {t("issueRefund")}
          </Button>
        )}
      </div>

      {open && (
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === "lines" ? "primary" : "outline"}
              onClick={() => setMode("lines")}
            >
              {t("refundByLine")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "amount" ? "primary" : "outline"}
              onClick={() => setMode("amount")}
            >
              {t("refundByAmount")}
            </Button>
          </div>

          {mode === "lines" ? (
            <ul className="flex flex-col gap-2">
              {order.items.map((item) => {
                const checked = item.id in selected;
                return (
                  <li key={item.id} className="flex items-center gap-3">
                    <Checkbox
                      id={`refund-line-${item.id}`}
                      checked={checked}
                      onCheckedChange={(value) => toggleLine(item.id, item.quantity, value === true)}
                    />
                    <label htmlFor={`refund-line-${item.id}`} className="flex-1 truncate text-body-b7 text-foreground">
                      {item.name}
                    </label>
                    {checked && (
                      <Input
                        type="number"
                        dir="ltr"
                        min={1}
                        max={item.quantity}
                        value={selected[item.id]}
                        onChange={(event) => {
                          const next = Math.min(item.quantity, Math.max(1, Number(event.target.value) || 1));
                          setLineQuantity(item.id, next);
                        }}
                        className="w-20"
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <Input
              type="number"
              dir="ltr"
              min={0.01}
              max={remaining}
              step={0.01}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              aria-label={t("refundAmountLabel")}
              className="w-40"
            />
          )}

          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t("refundReasonPlaceholder")}
            aria-label={t("refundReasonPlaceholder")}
            rows={2}
            disabled={pending}
          />

          <div className="flex items-center gap-3">
            <Button type="button" size="sm" disabled={pending || !canSubmit} onClick={submit}>
              {pending ? t("refundPending") : t("refundConfirm")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
            >
              {t("cancel")}
            </Button>
          </div>

          {error && <FormMessage>{error}</FormMessage>}
        </div>
      )}
    </section>
  );
}
