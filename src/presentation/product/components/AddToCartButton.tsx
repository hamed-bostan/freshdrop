import { Plus } from "lucide-react";
import { Button, Icon } from "@/src/presentation/design-system";

interface AddToCartButtonProps {
  productId: string;
}

export function AddToCartButton({ productId: _productId }: AddToCartButtonProps) {
  return (
    <Button size="sm" iconOnly aria-label="Add to cart" className="rounded-full">
      <Icon icon={Plus} size="md" />
    </Button>
  );
}
