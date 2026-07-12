import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { Button } from "@/src/presentation/design-system";
import { emptyOrder } from "@/src/shared/assets/images";

/** Shown when the user has no orders at all. */
export async function OrdersEmptyState() {
  const t = await getTranslations("orders");

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col items-center gap-8 pt-10">
        <h2 className="text-heading-h3 text-foreground">{t("emptyTitle")}</h2>
        {/* Decorative — the heading conveys the meaning. */}
        <Image src={emptyOrder} alt="" sizes="288px" className="h-auto w-full max-w-72" />
      </div>

      <Button asChild size="lg" className="mt-auto w-full">
        <Link href="/">{t("goToHome")}</Link>
      </Button>
    </div>
  );
}
