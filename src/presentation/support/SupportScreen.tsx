import { type LucideProps, Phone, Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/src/presentation/components/PageHeader";
import { Icon, WhatsappIcon, InstagramIcon, YoutubeIcon } from "@/src/presentation/design-system";

import { SupportSection, SupportRow, LiveChatRow } from "./components";

import type { ComponentType } from "react";

interface SocialLink {
  labelKey: "socialWhatsapp" | "socialInstagram" | "socialYoutube";
  href: string;
  icon: ComponentType<LucideProps>;
}

const SOCIAL_LINKS: SocialLink[] = [
  { labelKey: "socialWhatsapp", href: "https://wa.me/18001234567", icon: WhatsappIcon },
  { labelKey: "socialInstagram", href: "https://www.instagram.com/", icon: InstagramIcon },
  { labelKey: "socialYoutube", href: "https://www.youtube.com/", icon: YoutubeIcon },
];

export default async function SupportScreen() {
  const t = await getTranslations("support");

  return (
    <div className="flex min-h-dvh flex-col gap-6 px-6 pb-10">
      <PageHeader title={t("title")} />

      <p className="text-body-b6 text-foreground">{t("intro")}</p>

      <SupportSection title={t("followUs")}>
        {SOCIAL_LINKS.map(({ labelKey, href, icon }) => (
          <SupportRow key={labelKey} href={href} external icon={<Icon icon={icon} size="sm" />}>
            {t(labelKey)}
          </SupportRow>
        ))}
      </SupportSection>

      <SupportSection title={t("contactUs")}>
        <SupportRow icon={<Icon icon={Phone} size="sm" />} href="tel:+18001234567">
          {t("hotlineLabel")} <span className="underline">+1 800 123 4567</span>
        </SupportRow>
        <SupportRow icon={<Icon icon={Mail} size="sm" />} href="mailto:support@yourapp.com">
          {t("emailLabel")} <span className="underline">support@yourapp.com</span>
        </SupportRow>
        <LiveChatRow />
      </SupportSection>
    </div>
  );
}
