import Link from "next/link";
import { cn } from "@/src/lib/utils";

interface SectionHeaderProps {
  title: string;
  href?: string;
  className?: string;
  id?: string;
}

export function SectionHeader({ title, href, className, id }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <p id={id} className="text-body-b1 text-foreground">{title}</p>
      {href && (
        <Link href={href} className="text-body-b8 text-muted-foreground hover:text-foreground transition-colors">
          view all
        </Link>
      )}
    </div>
  );
}
