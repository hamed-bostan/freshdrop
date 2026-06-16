import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { Button, Icon } from "@/src/presentation/design-system";
import { productImage } from "@/src/shared/assets/images";

export function HeroBanner() {
  return (
    <div className="relative overflow-hidden rounded-xl min-h-40 bg-linear-to-t from-primary/50 to-primary">
      <div className="absolute top-7 left-8 z-20">
        <h4 className="mb-2 text-heading-h4 text-accent">
          Fresh Veggies
          <br />
          Fresh Discounts
        </h4>
        <Button variant="ghost" size="sm" className="gap-2 text-accent">
          <Icon icon={ShoppingCart} size="lg" />
          Get Fresh Now
        </Button>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute -right-14 top-1/2 size-48 -translate-y-1/2 rounded-full bg-muted-strong"
      />

      <div className="absolute top-4 right-4 z-10">
        <Image src={productImage} alt="Fresh vegetables" className="object-cover" priority />
      </div>
    </div>
  );
}
