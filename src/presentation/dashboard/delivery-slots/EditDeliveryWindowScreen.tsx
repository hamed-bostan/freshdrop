import { getTranslations } from "next-intl/server";

import type { DeliveryWindow } from "@/src/domain/entities/DeliveryWindow";

import { DeliveryWindowForm } from "./DeliveryWindowForm";

/**
 * Edit screen. Presentational: the page fetches the window over the REST API (BFF)
 * during server render and passes it in, then hands it to the shared
 * `DeliveryWindowForm`. A missing window is handled upstream via `notFound()`.
 */
export async function EditDeliveryWindowScreen({ window }: { window: DeliveryWindow }) {
  const t = await getTranslations("dashDeliverySlots");

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-heading-h2 text-foreground">{t("editHeading")}</h1>
        <p className="text-body-b6 text-muted-foreground">{t("editSubtitle", { label: window.label })}</p>
      </div>
      <DeliveryWindowForm mode="edit" window={window} />
    </div>
  );
}
