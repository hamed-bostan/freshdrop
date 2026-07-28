import Image from "next/image";
import { Package, Heart, MapPin, CreditCard, Settings, HelpCircle, Shield, Pencil } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { UserProfile } from "./profile-response-schema";
import { Avatar, Icon } from "@/src/presentation/design-system";
import { Link } from "@/src/i18n/navigation";
import { MenuRow, SectionLabel } from "@/src/presentation/components/menu-row";
import { LogoutRow } from "./components/LogoutRow";

interface ProfileScreenProps {
  user: UserProfile;
}

export default async function ProfileScreen({ user }: ProfileScreenProps) {
  const t = await getTranslations("profile");

  return (
    <div className="flex flex-col gap-6 px-6 pb-24">
      <header className="pt-5">
        <h1 className="text-center text-heading-h3 text-foreground">{t("title")}</h1>
      </header>

      <div className="flex items-center gap-4 rounded-card-xl bg-muted p-4">
        <Avatar name={user.name} className="size-16">
          {user.avatarUrl && (
            <Image
              src={user.avatarUrl}
              alt={t("photoAlt", { name: user.name })}
              width={64}
              height={64}
              className="size-full object-cover"
            />
          )}
        </Avatar>

        <div className="flex flex-1 flex-col">
          <p className="text-heading-h5 text-foreground">{user.name}</p>
          <p className="text-body-b6 text-muted-foreground">{user.phone}</p>
          <Link href="/profile/details" className="mt-1 flex w-fit items-center gap-1 text-body-b7 text-primary">
            <Icon icon={Pencil} size="xs" />
            {t("editProfile")}
          </Link>
        </div>
      </div>

      <MenuRow icon={Package} label={t("menuMyOrders")} subtitle={t("menuMyOrdersSubtitle")} href="/orders" />

      <div className="flex flex-col gap-2">
        <SectionLabel>{t("sectionShopping")}</SectionLabel>
        <MenuRow icon={Heart} label={t("menuFavorites")} subtitle={t("menuFavoritesSubtitle")} href="/favorites" />
        <MenuRow
          icon={MapPin}
          label={t("menuManageAddress")}
          subtitle={t("menuManageAddressSubtitle")}
          href="/profile/addresses"
        />
        <MenuRow
          icon={CreditCard}
          label={t("menuPaymentMethods")}
          subtitle={t("menuPaymentMethodsSubtitle")}
          href="/profile/payment-methods"
        />
      </div>

      <div className="flex flex-col gap-2">
        <SectionLabel>{t("sectionAccountSupport")}</SectionLabel>
        <MenuRow icon={Settings} label={t("menuSettings")} href="/profile/settings" />
        <MenuRow icon={HelpCircle} label={t("menuSupport")} href="/profile/support" />
        <MenuRow icon={Shield} label={t("menuAboutLegal")} href="/profile/settings/about" />
      </div>

      <LogoutRow />
    </div>
  );
}
