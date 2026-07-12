import { getTranslations } from "next-intl/server";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/src/presentation/design-system";
import type { Product } from "@/src/domain/entities/Product";

interface ProductInfoAccordionProps {
  product: Product;
}

type Section = { value: string; label: string; content: string };

/** Collapsible product detail / nutritions / origins sections (only those present). */
export async function ProductInfoAccordion({ product }: ProductInfoAccordionProps) {
  const t = await getTranslations("product");

  // Section content is catalog data (localized once content translation lands); only
  // the section labels are UI copy.
  const sections: Section[] = [
    { value: "detail", label: t("infoDetail"), content: product.description },
    { value: "nutrition", label: t("infoNutrition"), content: product.nutrition },
    { value: "origin", label: t("infoOrigin"), content: product.origin },
  ].filter((section): section is Section => Boolean(section.content));

  if (sections.length === 0) return null;

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
