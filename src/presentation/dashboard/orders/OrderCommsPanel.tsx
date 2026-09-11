"use client";

import { Mail, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import type { OrderNotificationInput } from "@/src/contracts/order-notification-schema";
import type { Order } from "@/src/domain/entities/Order";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { Button, Icon, Input, Textarea } from "@/src/presentation/design-system";

import { ordersApi } from "./order-api";

import type { OrderMessageDefaultWire } from "./order-message-default-response-schema";

type OrderCommsPanelProps = {
  order: Order;
  /** Whether the customer has an email address on file — a one-off note needs one. */
  canEmail: boolean;
  /**
   * The message form's starting subject/body (phase 4) — the `message_default`
   * template rendered for this order. `undefined` when the viewer can't send
   * (the page never fetches it then); still fully editable before send.
   */
  messageDefault?: OrderMessageDefaultWire;
};

/**
 * Send the customer a message about this order.
 *
 * Every notification in this app fires from the state change that caused it and is
 * best-effort, so a gateway that was down when an order shipped simply means the
 * customer never heard — and until now there was nothing an admin could do about
 * that from here. These buttons re-fire the *same* notifications through the same
 * templates, rather than offering a second way to word them.
 *
 * Only the ones that are currently true are offered: "out for delivery" appears
 * once the order has actually gone out, and the per-line notices only for lines
 * that were actually substituted or refunded. The server enforces the same rules —
 * this just avoids showing a button that can only fail.
 *
 * No `router.refresh()` after a send: nothing about the order changed. The panel
 * reports what it did and leaves the page as it was.
 */
export function OrderCommsPanel({ order, canEmail, messageDefault }: OrderCommsPanelProps) {
  const t = useTranslations("dashOrderComms");
  const tApiErrors = useTranslations("apiErrors");

  // Pre-filled from the template default on mount, still fully editable before
  // send — a starting point, not a locked value. `useState`'s initializer (not
  // an effect) so it never clobbers what an admin already typed.
  const [subject, setSubject] = React.useState(messageDefault?.subject ?? "");
  const [body, setBody] = React.useState(messageDefault?.body ?? "");
  const [sent, setSent] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function send(values: OrderNotificationInput, label: string): void {
    setError(null);
    setSent(null);
    startTransition(async () => {
      try {
        await ordersApi.notifyCustomer(order.id, values);
        setSent(label);
        if (values.kind === "message") {
          setSubject("");
          setBody("");
        }
      } catch (err) {
        setError(localizeApiError(err, tApiErrors, t("sendError")));
      }
    });
  }

  // The lifecycle resends the order's current state makes truthful. Confirmation is
  // always available — every order was confirmed at some point, and it's the one
  // customers most often ask for again.
  const resends: { kind: OrderNotificationInput["kind"]; label: string; available: boolean }[] = [
    { kind: "orderConfirmed", label: t("resendConfirmation"), available: true },
    {
      kind: "orderOutForDelivery",
      label: t("resendOutForDelivery"),
      available: order.stage === "shipped" || order.stage === "arrived",
    },
    { kind: "orderDelivered", label: t("resendDelivered"), available: order.stage === "arrived" },
    { kind: "returnApproved", label: t("resendReturnApproved"), available: order.status === "refunded" },
  ];

  const resolvedLines = order.items.filter((item) => item.substitution != null);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h3 className="text-body-b8 text-foreground">{t("resendHeading")}</h3>
        <div className="flex flex-wrap gap-2">
          {resends
            .filter((resend) => resend.available)
            .map((resend) => (
              <Button
                key={resend.kind}
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => send({ kind: resend.kind } as OrderNotificationInput, resend.label)}
              >
                <Icon icon={Send} size="sm" className="me-1.5" />
                {resend.label}
              </Button>
            ))}
        </div>
      </div>

      {resolvedLines.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-body-b8 text-foreground">{t("linesHeading")}</h3>
          <p className="text-body-b10 text-muted-foreground">{t("linesHint")}</p>
          <div className="flex flex-col gap-2">
            {resolvedLines.map((item) => {
              const substituted = item.substitution?.status === "substituted";
              const label = substituted
                ? t("notifySubstituted", { name: item.name })
                : t("notifyRefunded", { name: item.name });
              return (
                <Button
                  key={item.productId}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  disabled={pending}
                  onClick={() =>
                    send(
                      {
                        kind: substituted ? "itemSubstituted" : "itemRefunded",
                        productId: item.productId,
                      },
                      label,
                    )
                  }
                >
                  <Icon icon={Send} size="sm" className="me-1.5 shrink-0" />
                  <span className="truncate">{label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <h3 className="text-body-b8 text-foreground">{t("messageHeading")}</h3>
        {canEmail ? (
          <>
            {/* Email, not SMS: the SMS channel sends approved pattern templates
                with filled-in variables, so free prose has nowhere to go in it. */}
            <Input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder={t("subjectPlaceholder")}
              aria-label={t("subjectLabel")}
              disabled={pending}
            />
            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={t("messagePlaceholder")}
              aria-label={t("messageLabel")}
              rows={4}
              disabled={pending}
            />
            <Button
              size="sm"
              className="self-start"
              disabled={pending || subject.trim() === "" || body.trim() === ""}
              onClick={() => send({ kind: "message", subject, body }, t("messageSentLabel"))}
            >
              <Icon icon={Mail} size="sm" className="me-1.5" />
              {t("sendMessage")}
            </Button>
          </>
        ) : (
          <p className="text-body-b6 text-muted-foreground">{t("noEmail")}</p>
        )}
      </div>

      {/* "Sent", not "delivered" — the channels are best-effort by contract, so
          this confirms the send was made and claims nothing more. */}
      {sent ? <p className="text-body-b6 text-primary">{t("sentConfirmation", { what: sent })}</p> : null}
      {error ? <p className="text-body-b6 text-destructive">{error}</p> : null}
    </div>
  );
}
