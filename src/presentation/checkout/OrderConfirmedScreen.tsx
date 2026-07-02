import Image from "next/image";
import Link from "next/link";
import type { Order } from "@/src/domain/entities/Order";
import { Button } from "@/src/presentation/design-system";
import { OrderAdjustments } from "@/src/presentation/orders/components";
import { orderConfirmed } from "@/src/shared/assets/images";

interface OrderConfirmedScreenProps {
  /** The order just placed, used to itemize any out-of-stock refunds on the receipt. */
  order?: Order;
}

export default function OrderConfirmedScreen({ order }: OrderConfirmedScreenProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center gap-6 px-6 pb-10 pt-20">

      <div className="flex flex-1 flex-col items-center justify-center gap-12">
        <Image
          src={orderConfirmed}
          alt=""
          sizes="288px"
          className="h-auto w-full max-w-72"
          priority
        />

        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-heading-h2 text-foreground">Order Confirmed</h1>
          <p className="text-body-b4 text-muted-foreground">
            Thank you for shopping with us
          </p>
        </div>

        {order && <OrderAdjustments order={order} />}

      </div>

      <div className="flex w-full flex-col gap-3">
        <Button asChild variant="link"  className="w-full">
          <Link href="/">Back to Home</Link>
        </Button>

        <Button asChild size="lg" className="w-full">
          <Link href="/orders">Track Order</Link>
        </Button>


      </div>
    </div>
  );
}
