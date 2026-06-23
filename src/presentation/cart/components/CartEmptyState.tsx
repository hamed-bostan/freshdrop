import Image from "next/image";
import { emptyCart } from "@/src/shared/assets/images";

/** Shown when the cart has no items (initially, or after the last item is removed). */
export function CartEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      {/* Decorative — the heading conveys the meaning. */}
      <Image src={emptyCart} alt="" sizes="208px" className="h-auto w-full max-w-52" />
      <h2 className="text-heading-h3 text-primary">Your Cart Is Empty</h2>
    </div>
  );
}
