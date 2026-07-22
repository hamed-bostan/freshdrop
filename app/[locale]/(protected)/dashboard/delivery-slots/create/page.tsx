import { getTranslations } from "next-intl/server";
import { DeliveryWindowForm } from "@/src/presentation/dashboard/delivery-slots/DeliveryWindowForm";
import { requirePermission } from "@/src/lib/require-permission";

export default async function CreateDeliveryWindowPage() {
  // The layout only gates on `dashboard.view`; this whole section is a write
  // surface, so anyone without the permission is redirected rather than shown a
  // page whose every read would 401.
  await requirePermission("promotions.write");

  const t = await getTranslations("dashDeliverySlots");

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-heading-h2 text-foreground">{t("newWindow")}</h1>
        <p className="text-body-b6 text-muted-foreground">{t("createSubtitle")}</p>
      </div>
      <DeliveryWindowForm mode="create" />
    </div>
  );
}
