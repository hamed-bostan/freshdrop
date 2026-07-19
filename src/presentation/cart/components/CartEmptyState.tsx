import Image from "next/image";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/src/presentation/design-system";
import { emptyCart } from "@/src/shared/assets/images";

/** Shown when the cart has no items (initially, or after the last item is removed). */
export function CartEmptyState() {
  const t = useTranslations("cart");

  return (
    <EmptyState
      className="flex-1 justify-center"
      illustration={<Image src={emptyCart} alt="" sizes="208px" className="h-auto w-full max-w-52" />}
      title={t("empty")}
    />
  );
}
