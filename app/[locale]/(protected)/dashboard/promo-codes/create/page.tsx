import { getTranslations } from "next-intl/server";
import { PromoCodeForm } from "@/src/presentation/dashboard/promo-codes/PromoCodeForm";
import { requirePermission } from "@/src/lib/require-permission";

export default async function CreatePromoCodePage() {
  // The layout only gates on `dashboard.view`; this whole section is a write
  // surface, so anyone without the permission is redirected rather than shown a
  // page whose every read would 401.
  await requirePermission("promotions.write");

  const t = await getTranslations("dashPromoCodes");

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-heading-h2 text-foreground">{t("newPromoCode")}</h1>
        <p className="text-body-b6 text-muted-foreground">{t("createSubtitle")}</p>
      </div>
      <PromoCodeForm mode="create" />
    </div>
  );
}
