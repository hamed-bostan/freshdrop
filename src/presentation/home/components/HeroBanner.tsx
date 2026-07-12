import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ShoppingCart } from "lucide-react";
import { Button, Icon } from "@/src/presentation/design-system";
import { heroBanner } from "@/src/shared/assets/images";

export async function HeroBanner() {
  const t = await getTranslations("home");

  return (
    <div className="relative overflow-hidden rounded-card-xl min-h-40 bg-linear-to-t from-primary/50 to-primary">
      <div className="absolute top-7 left-8 z-20">
        {/* rich text so each locale controls its own line break */}
        <h4 className="mb-2 text-heading-h4 text-accent">{t.rich("heroTitle", { br: () => <br /> })}</h4>
        <Button variant="ghost" size="sm" className="gap-2 text-accent">
          <Icon icon={ShoppingCart} size="lg" />
          {t("heroCta")}
        </Button>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute -right-14 top-1/2 size-48 -translate-y-1/2 rounded-full bg-muted-strong"
      />

      <div className="absolute top-4 right-4 z-10">
        <Image src={heroBanner} alt={t("heroImageAlt")} className="object-cover" priority />
      </div>
    </div>
  );
}
