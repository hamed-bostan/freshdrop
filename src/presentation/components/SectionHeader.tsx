import { getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { cn } from "@/src/lib/utils";

interface SectionHeaderProps {
  title: string;
  href?: string;
  className?: string;
  id?: string;
}

export async function SectionHeader({ title, href, className, id }: SectionHeaderProps) {
  const t = await getTranslations("common");

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <p id={id} className="text-body-b1 text-foreground">{title}</p>
      {href && (
        <Link href={href} className="text-body-b8 text-muted-foreground hover:text-foreground transition-colors">
          {t("viewAll")}
        </Link>
      )}
    </div>
  );
}
