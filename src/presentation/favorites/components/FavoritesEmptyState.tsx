import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { Button, EmptyState } from "@/src/presentation/design-system";
import { favoriteList } from "@/src/shared/assets/images";

/** Shown when the user hasn't favorited anything yet. */
export async function FavoritesEmptyState() {
  const t = await getTranslations("favorites");
  const tCommon = await getTranslations("common");

  return (
    <EmptyState
      className="pt-8"
      // Design size 240×250.
      illustration={<Image src={favoriteList} alt="" sizes="240px" className="h-auto w-full max-w-60" />}
      title={t("emptyTitle")}
      description={t("emptyBody")}
      action={
        <Button asChild size="lg" className="mt-20 w-full">
          <Link href="/">{tCommon("startShopping")}</Link>
        </Button>
      }
    />
  );
}
