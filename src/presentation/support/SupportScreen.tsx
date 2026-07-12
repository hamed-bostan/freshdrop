import type { ComponentType } from "react";
import { getTranslations } from "next-intl/server";
import { type LucideProps, Phone, Mail } from "lucide-react";
import { Icon, WhatsappIcon, InstagramIcon, YoutubeIcon } from "@/src/presentation/design-system";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { SupportSection, SupportRow, LiveChatRow } from "./components";

interface SocialLink {
  label: string;
  href: string;
  icon: ComponentType<LucideProps>;
}

const SOCIAL_LINKS: SocialLink[] = [
  { label: "WhatsApp", href: "https://wa.me/18001234567", icon: WhatsappIcon },
  { label: "Instagram", href: "https://www.instagram.com/", icon: InstagramIcon },
  { label: "Youtube", href: "https://www.youtube.com/", icon: YoutubeIcon },
];

export default async function SupportScreen() {
  const t = await getTranslations("support");

  return (
    <div className="flex min-h-dvh flex-col gap-6 px-6 pb-10">
      <PageHeader title={t("title")} />

      <p className="text-body-b6 text-foreground">{t("intro")}</p>

      <SupportSection title={t("followUs")}>
        {SOCIAL_LINKS.map(({ label, href, icon }) => (
          <SupportRow key={label} href={href} external icon={<Icon icon={icon} size="sm" />}>
            {label}
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
