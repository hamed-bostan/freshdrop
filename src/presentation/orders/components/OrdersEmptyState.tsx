import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { Button, EmptyState } from "@/src/presentation/design-system";
import { emptyOrder } from "@/src/shared/assets/images";

/** Shown when the user has no orders at all. */
export async function OrdersEmptyState() {
  const t = await getTranslations("orders");

  return (
    <EmptyState
      className="flex-1 pt-10"
      titleFirst
      illustration={<Image src={emptyOrder} alt="" sizes="288px" className="h-auto w-full max-w-72" />}
      title={t("emptyTitle")}
      action={
        <Button asChild size="lg" className="mt-auto w-full">
          <Link href="/">{t("goToHome")}</Link>
        </Button>
      }
    />
  );
}
