"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import * as React from "react";

import type { OrderReturnRequestInput } from "@/src/contracts/order-return-schema";
import type { Order } from "@/src/domain/entities/Order";
import { formatMoney } from "@/src/lib/formatMoney";
import {
  Button,
  Checkbox,
  FormMessage,
  Modal,
  ModalClose,
  ModalContent,
  Textarea,
  Thumbnail,
} from "@/src/presentation/design-system";

type ReturnRequestDialogProps = {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  error: string | null;
  onSubmit: (input: OrderReturnRequestInput) => void;
};

/**
 * The return-request confirmation, expanded from a plain yes/no into which
 * items to return (defaulting to all of them, at their full ordered quantity)
 * plus an optional reason — what `RequestOrderReturn` now records per line
 * rather than assuming the whole order.
 */
export function ReturnRequestDialog({ order, open, onOpenChange, pending, error, onSubmit }: ReturnRequestDialogProps) {
  const t = useTranslations("orders");
  const locale = useLocale();
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set(order.items.map((item) => item.id)));
  const [reason, setReason] = React.useState("");

  // Reset the selection each time the dialog reopens for a (possibly different) order.
  React.useEffect(() => {
    if (open) setSelected(new Set(order.items.map((item) => item.id)));
  }, [open, order.items]);

  function toggle(itemId: string): void {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  function submit(): void {
    const items = order.items
      .filter((item) => selected.has(item.id))
      .map((item) => ({ orderItemId: item.id, quantity: item.quantity }));
    if (items.length === 0) return;
    onSubmit({ reason: reason.trim() || undefined, items });
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next && !pending) onOpenChange(false);
      }}
    >
      <ModalContent title={t("returnTitle")} description={t("returnDescription")}>
        <div className="flex flex-col gap-4 pt-2">
          <p className="text-center text-body-b7 text-muted-foreground">{t("returnDescription")}</p>

          <ul className="flex max-h-64 flex-col gap-3 overflow-y-auto">
            {order.items.map((item) => {
              const itemChecked = selected.has(item.id);
              return (
                <li key={item.id} className="flex items-center gap-3">
                  <Checkbox
                    id={`return-item-${item.id}`}
                    checked={itemChecked}
                    onCheckedChange={() => toggle(item.id)}
                    disabled={pending}
                  />
                  <Thumbnail as="span" className="size-9 shrink-0">
                    <Image src={item.imageUrl} alt="" width={36} height={36} className="size-full object-contain" />
                  </Thumbnail>
                  <label
                    htmlFor={`return-item-${item.id}`}
                    className="min-w-0 flex-1 truncate text-body-b7 text-foreground"
                  >
                    {item.name}
                  </label>
                  <span className="shrink-0 text-body-b8 text-muted-foreground">
                    {t("returnItemQty", { qty: item.quantity, price: formatMoney(item.price, locale) })}
                  </span>
                </li>
              );
            })}
          </ul>

          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t("returnReasonPlaceholder")}
            disabled={pending}
            rows={3}
            className="h-auto"
          />

          {error && <FormMessage>{error}</FormMessage>}

          <div className="grid grid-cols-2 gap-2">
            <ModalClose asChild>
              <Button type="button" variant="outline" size="sm" disabled={pending}>
                {t("notNow")}
              </Button>
            </ModalClose>
            <Button type="button" size="sm" disabled={pending || selected.size === 0} onClick={submit}>
              {pending ? t("requesting") : t("returnConfirm")}
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
