import { getTranslations } from "next-intl/server";

import type { Product } from "@/src/domain/entities/Product";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/src/presentation/design-system";

interface ProductInfoAccordionProps {
  product: Product;
}

type Section = { value: string; label: string; content: string };

/**
 * Collapsible product detail / nutritions / origins sections. Each shows the
 * product's authored copy when present, otherwise a localized generic fallback —
 * so the section reads in the active locale even for products with no bespoke text
 * (the common case). Genuinely authored per-product content renders as stored;
 * translating that is the deferred catalog-content phase. The section labels are
 * always UI copy.
 */
export async function ProductInfoAccordion({ product }: ProductInfoAccordionProps) {
  const t = await getTranslations("product");

  const sections: Section[] = [
    { value: "detail", label: t("infoDetail"), content: product.description ?? t("infoDetailFallback") },
    { value: "nutrition", label: t("infoNutrition"), content: product.nutrition ?? t("infoNutritionFallback") },
    { value: "origin", label: t("infoOrigin"), content: product.origin ?? t("infoOriginFallback") },
  ];

  return (
    <Accordion type="single" collapsible className="flex flex-col gap-3">
      {sections.map((section) => (
        <AccordionItem key={section.value} value={section.value}>
          <AccordionTrigger>{section.label}</AccordionTrigger>
          <AccordionContent>{section.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
