"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { DeliverySlotDay } from "@/src/domain/entities/DeliverySlot";
import type { DeliveryType, PaymentStatus } from "@/src/domain/entities/Order";
import type { Product } from "@/src/domain/entities/Product";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import type { AdminOrderInput } from "@/src/contracts/admin-order-schema";
import {
  Button,
  Field,
  FormMessage,
  Select,
  TextField,
} from "@/src/presentation/design-system";
import { useRouter } from "@/src/i18n/navigation";
import { ApiError } from "@/src/lib/api/ApiError";
import { localizeApiError } from "@/src/lib/api/localizeApiError";
import { formatMoney } from "@/src/lib/formatMoney";
import type { Locale } from "@/src/i18n/routing";
import { AsyncSearchPicker } from "./AsyncSearchPicker";
import { createOrderApi } from "./create-order-api";
import { customersApi } from "@/src/presentation/dashboard/customers/customer-api";
import { productsApi } from "@/src/presentation/dashboard/products/product-api";

type Line = { product: Product; quantity: number };

/**
 * The payment states an order can be *created* in — `refunded` is excluded because
 * it's an outcome of the return flow, not a state you place an order in (the same
 * cut `adminOrderSchema` makes, mirrored here so the picker can't offer it).
 */
type CreatablePaymentStatus = Exclude<PaymentStatus, "refunded">;

const DELIVERY_TYPES: DeliveryType[] = ["delivery", "pickup"];
const PAYMENT_STATUSES: CreatablePaymentStatus[] = ["paid", "pending", "failed"];

/**
 * The dashboard's create-order form — an order entered by hand, for the one that
 * came in by phone.
 *
 * A single client component, and deliberately not split into the API's shape: the
 * server is handed product ids and quantities, but the person filling this in
 * works in customers and products and running totals, so that is what the form
 * holds. It sends no amounts (see `adminOrderSchema`); the total shown here is a
 * preview built from the same rule the server prices with, and the server's answer
 * is the one that counts.
 *
 * The pickers read as you type — the one place the create flow can't be a server
 * render, because choosing a customer mustn't discard the half-built order around
 * it. Everything else is ordinary controlled state.
 */
export function CreateOrderForm({ slotDays }: { slotDays: DeliverySlotDay[] }) {
  const t = useTranslations("dashCreateOrder");
  const tApiErrors = useTranslations("apiErrors");
  const locale = useLocale() as Locale;
  const router = useRouter();

  const [customer, setCustomer] = React.useState<CustomerOrderSummary | null>(null);
  const [lines, setLines] = React.useState<Line[]>([]);
  const [location, setLocation] = React.useState("");
  const [deliveryType, setDeliveryType] = React.useState<DeliveryType>("delivery");
  const [paymentStatus, setPaymentStatus] = React.useState<CreatablePaymentStatus>("paid");
  const [slotKey, setSlotKey] = React.useState("");

  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  // Flatten the day/window tree into pickable options, skipping full windows —
  // an admin can't book what a shopper can't. The value carries both halves the
  // API needs, since the domain keys a slot by (date, windowId).
  const slotOptions = slotDays.flatMap((day) =>
    day.slots
      .filter((slot) => slot.availability.level !== "full")
      .map((slot) => ({
        key: `${day.date}|${slot.windowId}`,
        label: `${day.label} · ${slot.timeRange}`,
      })),
  );

  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);

  function addProduct(product: Product): void {
    setLines((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      // Re-adding a product already on the order bumps its quantity rather than
      // splitting it across two lines the server would then reject as duplicate.
      if (existing) {
        return current.map((line) =>
          line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [...current, { product, quantity: 1 }];
    });
  }

  function setQuantity(productId: string, quantity: number): void {
    setLines((current) =>
      current.map((line) =>
        line.product.id === productId ? { ...line, quantity: Math.max(1, quantity) } : line,
      ),
    );
  }

  function removeLine(productId: string): void {
    setLines((current) => current.filter((line) => line.product.id !== productId));
  }

  function submit(event: React.FormEvent): void {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);

    // Cheap client-side guards for the two things that make the form meaningless,
    // so someone isn't sent to the server to be told the obvious. The server
    // re-checks everything regardless — this is courtesy, not trust.
    if (!customer) {
      setFieldErrors({ userId: t("errorCustomerRequired") });
      return;
    }
    if (lines.length === 0) {
      setFieldErrors({ lines: t("errorLinesRequired") });
      return;
    }
    const [deliveryDate, deliveryWindowId] = slotKey.split("|");
    if (!deliveryDate || !deliveryWindowId) {
      setFieldErrors({ slot: t("errorSlotRequired") });
      return;
    }

    const payload: AdminOrderInput = {
      userId: customer.userId,
      lines: lines.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
      location,
      deliveryDate,
      deliveryWindowId,
      deliveryType,
      paymentStatus,
    };

    startTransition(async () => {
      try {
        const order = await createOrderApi.create(payload);
        // Land on the order that was just created, not back on the list — the next
        // thing anyone does with a phone order is read it back to the caller.
        router.push(`/dashboard/orders/${order.id}`);
      } catch (error) {
        if (error instanceof ApiError && error.fieldErrors) {
          // The server's field errors are keyed by the payload's paths; map the
          // ones the form can show back onto their controls.
          const mapped: Record<string, string> = {};
          for (const [key, messages] of Object.entries(error.fieldErrors)) {
            const message = messages?.[0];
            if (message) mapped[key.split(".")[0]] = message;
          }
          setFieldErrors(mapped);
        }
        setFormError(localizeApiError(error, tApiErrors, t("formError")));
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-8">
      {/* Customer */}
      <section className="flex flex-col gap-3">
        <h2 className="text-body-b5 text-foreground">{t("customerHeading")}</h2>
        {customer ? (
          <div className="flex items-center justify-between gap-3 rounded-card-lg border border-border p-3">
            <span className="min-w-0">
              <span className="block truncate text-body-b7 text-foreground">{customer.name}</span>
              <span dir="ltr" className="block truncate text-body-b8 text-muted-foreground">
                {customer.phone}
              </span>
            </span>
            <Button variant="ghost" size="sm" onClick={() => setCustomer(null)}>
              {t("changeCustomer")}
            </Button>
          </div>
        ) : (
          <AsyncSearchPicker<CustomerOrderSummary>
            label={t("customerSearchLabel")}
            placeholder={t("customerSearchPlaceholder")}
            search={customersApi.search}
            keyOf={(c) => c.userId}
            hintLabel={t("customerSearchHint")}
            emptyLabel={t("customerSearchEmpty")}
            onSelect={setCustomer}
            renderItem={(c) => (
              <span className="min-w-0">
                <span className="block truncate text-body-b6 text-foreground">{c.name}</span>
                <span dir="ltr" className="block truncate text-body-b8 text-muted-foreground">
                  {c.phone}
                </span>
              </span>
            )}
          />
        )}
        {fieldErrors.userId ? <FormMessage>{fieldErrors.userId}</FormMessage> : null}
      </section>

      {/* Products */}
      <section className="flex flex-col gap-3">
        <h2 className="text-body-b5 text-foreground">{t("productsHeading")}</h2>
        <AsyncSearchPicker<Product>
          label={t("productSearchLabel")}
          placeholder={t("productSearchPlaceholder")}
          search={productsApi.search}
          keyOf={(p) => p.id}
          hintLabel={t("productSearchHint")}
          emptyLabel={t("productSearchEmpty")}
          onSelect={addProduct}
          renderItem={(p) => (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.imageUrl} alt="" className="size-9 shrink-0 rounded-badge-md object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body-b6 text-foreground">{p.name}</span>
                <span className="block text-body-b8 text-muted-foreground">
                  {formatMoney(p.price, locale)}
                </span>
              </span>
            </>
          )}
        />

        {lines.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border rounded-card-lg border border-border">
            {lines.map((line) => (
              <li key={line.product.id} className="flex items-center gap-3 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={line.product.imageUrl} alt="" className="size-10 shrink-0 rounded-badge-md object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body-b6 text-foreground">{line.product.name}</span>
                  <span className="block text-body-b8 text-muted-foreground">
                    {formatMoney(line.product.price, locale)}
                  </span>
                </span>
                <input
                  type="number"
                  min={1}
                  aria-label={t("quantityLabel", { name: line.product.name })}
                  value={line.quantity}
                  onChange={(event) => setQuantity(line.product.id, Number(event.target.value))}
                  className="h-9 w-16 rounded-button border border-border bg-background px-2 text-center text-body-b6"
                />
                <span className="w-20 text-end text-body-b6 text-foreground">
                  {formatMoney(line.product.price * line.quantity, locale)}
                </span>
                <button
                  type="button"
                  aria-label={t("removeLine", { name: line.product.name })}
                  onClick={() => removeLine(line.product.id)}
                  className="text-icon-muted transition-colors hover:text-error-foreground"
                >
                  <Trash2 aria-hidden className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-card-lg border border-dashed border-border px-4 py-8 text-center text-body-b6 text-muted-foreground">
            {t("noLines")}
          </p>
        )}
        {fieldErrors.lines ? <FormMessage>{fieldErrors.lines}</FormMessage> : null}
      </section>

      {/* Fulfilment */}
      <section className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={t("addressLabel")}
          required
          error={fieldErrors.location}
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder={t("addressPlaceholder")}
        />

        <Field error={fieldErrors.slot}>
          {({ id, ariaDescribedBy, ariaInvalid }) => (
            <>
              <label htmlFor={id} className="text-body-b6 text-foreground">
                {t("slotLabel")}
              </label>
              <Select
                id={id}
                aria-describedby={ariaDescribedBy}
                aria-invalid={ariaInvalid}
                value={slotKey}
                onChange={(event) => setSlotKey(event.target.value)}
              >
                <option value="">{t("slotPlaceholder")}</option>
                {slotOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </>
          )}
        </Field>

        <Field>
          {({ id }) => (
            <>
              <label htmlFor={id} className="text-body-b6 text-foreground">
                {t("deliveryTypeLabel")}
              </label>
              <Select
                id={id}
                value={deliveryType}
                onChange={(event) => setDeliveryType(event.target.value as DeliveryType)}
              >
                {DELIVERY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`deliveryType_${type}`)}
                  </option>
                ))}
              </Select>
            </>
          )}
        </Field>

        <Field>
          {({ id }) => (
            <>
              <label htmlFor={id} className="text-body-b6 text-foreground">
                {t("paymentStatusLabel")}
              </label>
              <Select
                id={id}
                value={paymentStatus}
                onChange={(event) => setPaymentStatus(event.target.value as CreatablePaymentStatus)}
              >
                {PAYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {t(`paymentStatus_${status}`)}
                  </option>
                ))}
              </Select>
            </>
          )}
        </Field>
      </section>

      {/* Summary + submit */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
        <div className="text-body-b6 text-muted-foreground">
          {t("subtotalPreview")}{" "}
          <span className="text-body-b5 text-foreground">{formatMoney(subtotal, locale)}</span>
          {/* The delivery fee and final total are the server's to state — the form
              deliberately doesn't restate the pricing rule, only previews the
              lines it can see. */}
        </div>
        <div className="flex items-center gap-3">
          {formError ? <FormMessage>{formError}</FormMessage> : null}
          <Button type="submit" loading={pending}>
            {t("submit")}
          </Button>
        </div>
      </div>
    </form>
  );
}
