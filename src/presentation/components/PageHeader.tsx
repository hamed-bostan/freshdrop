"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button, Icon } from "@/src/presentation/design-system";

interface PageHeaderProps {
  /** Centred title. Omit for a back-only header. */
  title?: string;
}

/** Sub-page header: a back control on the left with an optional centred title. */
export function PageHeader({ title }: PageHeaderProps) {
  const router = useRouter();

  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center pt-3">
      <Button
        type="button"
        variant="ghost"
        iconOnly
        aria-label="Go back"
        onClick={() => router.back()}
        className="justify-self-start"
      >
        <Icon icon={ChevronLeft} size="md" className="text-foreground" />
      </Button>
      {title ? <h1 className="text-heading-h3 text-foreground">{title}</h1> : null}
    </header>
  );
}
