import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { Button } from "@/src/presentation/design-system";
import { favoriteList } from "@/src/shared/assets/images";

/** Shown when the user hasn't favorited anything yet. */
export async function FavoritesEmptyState() {
  const t = await getTranslations("favorites");
  const tCommon = await getTranslations("common");

  return (
    <div className="flex flex-col items-center gap-8 pt-8">
      {/* Decorative — the empty-state copy below conveys the meaning. Design size 240×250. */}
      <Image src={favoriteList} alt="" sizes="240px" className="h-auto w-full max-w-60" />

      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-heading-h4 text-foreground">{t("emptyTitle")}</h2>
        <p className="text-body-b4 text-muted-foreground">{t("emptyBody")}</p>
      </div>

      <Button asChild size="lg" className="mt-20 w-full">
        <Link href="/">{tCommon("startShopping")}</Link>
      </Button>
    </div>
  );
}
