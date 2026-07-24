import { getTranslations } from "next-intl/server";
import { CreateOrderForm } from "@/src/presentation/dashboard/orders/CreateOrderForm";
import { deliverySlotsServerApi } from "@/src/presentation/checkout/delivery-slot-server-api";
import { requirePermission } from "@/src/lib/require-permission";

// The bookable slots are read over the REST API (BFF) during server render, so the
// form paints with them already in hand. A failed fetch surfaces via the dashboard
// error boundary.
export const dynamic = "force-dynamic";

export default async function CreateOrderPage() {
  // The layout gates the section on `dashboard.view`; placing an order is a
  // fulfilment write, so anyone without it is redirected rather than shown a form
  // whose submit would 401.
  await requirePermission("orders.fulfill");

  const [slotDays, t] = await Promise.all([
    deliverySlotsServerApi.list(),
    getTranslations("dashCreateOrder"),
  ]);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-heading-h2 text-foreground">{t("heading")}</h1>
        <p className="text-body-b6 text-muted-foreground">{t("subtitle")}</p>
      </div>
      <CreateOrderForm slotDays={slotDays} />
    </div>
  );
}
