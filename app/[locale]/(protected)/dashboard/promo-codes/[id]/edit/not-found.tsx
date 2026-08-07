import { getTranslations } from "next-intl/server";

import { Link } from "@/src/i18n/navigation";
import { Button } from "@/src/presentation/design-system";

/** Shown when editing a promo code that no longer exists (the page called `notFound()`). */
export default async function EditPromoCodeNotFound() {
  const t = await getTranslations("dashPromoCodes");

  return (
    <div className="flex max-w-xl flex-col gap-3">
      <h1 className="text-heading-h2 text-foreground">{t("notFoundTitle")}</h1>
      <p className="text-body-b6 text-muted-foreground">{t("notFoundBody")}</p>
      <Button asChild variant="outline" size="sm" className="self-start">
        <Link href="/dashboard/promo-codes">{t("backToPromoCodes")}</Link>
      </Button>
    </div>
  );
}
