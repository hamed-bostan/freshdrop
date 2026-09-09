import { getTranslations } from "next-intl/server";

import type { AdminPromoCode } from "@/src/domain/entities/PromoCode";

import { PromoCodeForm } from "./PromoCodeForm";

/**
 * Edit screen. Presentational: the page fetches the campaign over the REST API
 * (BFF) during server render and passes it in, then hands it to the shared
 * `PromoCodeForm`. A missing campaign is handled upstream via `notFound()`.
 */
export async function EditPromoCodeScreen({ promoCode }: { promoCode: AdminPromoCode }) {
  const t = await getTranslations("dashPromoCodes");

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="dashboard-page-title">{t("editHeading")}</h1>
        <p className="text-body-b6 text-muted-foreground">{t("editSubtitle", { code: promoCode.code })}</p>
      </div>
      <PromoCodeForm mode="edit" promoCode={promoCode} />
    </div>
  );
}
