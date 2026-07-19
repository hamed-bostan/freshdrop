import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { User } from "lucide-react";
import type { UserProfile } from "./profile-response-schema";
import { Avatar, Icon } from "@/src/presentation/design-system";
import { ProfileMenuItem } from "./components/ProfileMenuItem";

type ProfileMenuLabelKey =
  | "menuYourProfile"
  | "menuManageAddress"
  | "menuPaymentMethods"
  | "menuMyOrders"
  | "menuFavorites"
  | "menuMyWallet"
  | "menuSupport"
  | "menuSettings";

interface ProfileMenuEntry {
  labelKey: ProfileMenuLabelKey;
  href: string;
}

const PROFILE_MENU: ProfileMenuEntry[] = [
  { labelKey: "menuYourProfile", href: "/profile/details" },
  { labelKey: "menuManageAddress", href: "/profile/addresses" },
  { labelKey: "menuPaymentMethods", href: "/profile/payment-methods" },
  { labelKey: "menuMyOrders", href: "/orders" },
  { labelKey: "menuFavorites", href: "/favorites" },
  { labelKey: "menuMyWallet", href: "/profile/wallet" },
  { labelKey: "menuSupport", href: "/profile/support" },
  { labelKey: "menuSettings", href: "/profile/settings" },
];

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

      <div className="flex flex-col items-center gap-3">
        <Avatar
          tone="surface"
          className="size-24"
          fallback={<Icon icon={User} className="size-12 text-icon-muted" />}
        >
          {user.avatarUrl && (
            <Image
              src={user.avatarUrl}
              alt={t("photoAlt", { name: user.name })}
              width={96}
              height={96}
              className="size-full object-cover"
            />
          )}
        </Avatar>

        <div className="flex flex-col items-center gap-0.5">
          <p className="text-heading-h5 text-foreground">{user.name}</p>
          <p className="text-body-b6 text-muted-foreground">{user.phone}</p>
        </div>
      </div>

      <nav aria-label={t("menuAria")} className="flex flex-col gap-2">
        {PROFILE_MENU.map((item) => (
          <ProfileMenuItem key={item.href} label={t(item.labelKey)} href={item.href} />
        ))}
      </nav>
    </div>
  );
}
