import type { ComponentType } from "react";
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

export default function SupportScreen() {
  return (
    <div className="flex min-h-dvh flex-col gap-6 px-6 pb-10">
      <PageHeader title="Support" />

      <p className="text-body-b6 text-foreground">
        We&apos;re here to help you with any questions, issues, or feedback you may have.
      </p>

      <SupportSection title="Follow Us">
        {SOCIAL_LINKS.map(({ label, href, icon }) => (
          <SupportRow key={label} href={href} external icon={<Icon icon={icon} size="sm" />}>
            {label}
          </SupportRow>
        ))}
      </SupportSection>

      <SupportSection title="Contact us">
        <SupportRow icon={<Icon icon={Phone} size="sm" />} href="tel:+18001234567">
          Hotline: <span className="underline">+1 800 123 4567</span>
        </SupportRow>
        <SupportRow icon={<Icon icon={Mail} size="sm" />} href="mailto:support@yourapp.com">
          Email: <span className="underline">support@yourapp.com</span>
        </SupportRow>
        <LiveChatRow />
      </SupportSection>
    </div>
  );
}
