"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Clock, CreditCard, ClipboardList } from "lucide-react";
import type { Cart } from "@/src/domain/entities/Cart";
import type { DeliveryLocation } from "@/src/domain/entities/DeliveryLocation";
import type { DeliveryOption } from "@/src/domain/entities/DeliveryOption";
import type { PaymentMethod } from "@/src/domain/entities/PaymentMethod";
import { Button } from "@/src/presentation/design-system";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { DeliveryLocationItem } from "@/src/presentation/delivery-location/components/DeliveryLocationItem";
import { PaymentMethodOption } from "@/src/presentation/payment/components";
import { CheckoutSection, DeliveryOptionItem, OrderSummaryCard, OrderTotals } from "./components";

interface CheckoutScreenProps {
  cart: Cart;
  deliveryLocations: DeliveryLocation[];
  deliveryOptions: DeliveryOption[];
  paymentMethods: PaymentMethod[];
}

/**
 * The checkout / "Place Order" step reached from the cart. Composes the existing
 * delivery-location and payment-method selectors with a delivery-time choice, an
 * order recap and the price breakdown. Owns only the three selections; the cart
 * totals come pre-computed from the server.
 */
export default function CheckoutScreen({
  cart,
  deliveryLocations,
  deliveryOptions,
  paymentMethods,
}: CheckoutScreenProps) {
  const router = useRouter();
  const [addressId, setAddressId] = React.useState(() => deliveryLocations[0]?.id);
  const [optionId, setOptionId] = React.useState(() => deliveryOptions[0]?.id);
  const [paymentId, setPaymentId] = React.useState(() => paymentMethods[0]?.id);

  const placeOrder = (event: React.FormEvent) => {
    event.preventDefault();
    router.push("/cart/checkout/confirmed");
  };

  return (
    <form onSubmit={placeOrder} className="flex min-h-dvh flex-col gap-6 px-6 pb-28">
      <PageHeader title="Checkout" />

      <CheckoutSection
        icon={MapPin}
        title="Deliver To"
        action={
          <Link href="/profile/addresses/new" className="text-body-b8 text-primary">
            Add New Address
          </Link>
        }
      >
        <div className="flex flex-col gap-2">
          {deliveryLocations.map((location) => (
            <DeliveryLocationItem
              key={location.id}
              location={location}
              selected={location.id === addressId}
              onSelect={() => setAddressId(location.id)}
              onEdit={() => router.push("/profile/addresses")}
            />
          ))}
        </div>
      </CheckoutSection>

      <CheckoutSection icon={Clock} title="Delivery Time">
        <div className="flex flex-col gap-2">
          {deliveryOptions.map((option) => (
            <DeliveryOptionItem
              key={option.id}
              option={option}
              selected={option.id === optionId}
              onSelect={setOptionId}
            />
          ))}
        </div>
      </CheckoutSection>

      <CheckoutSection icon={CreditCard} title="Payment Method">
        <div className="flex flex-col gap-2">
          {paymentMethods.map((method) => (
            <PaymentMethodOption
              key={method.id}
              method={method}
              selected={method.id === paymentId}
              onSelect={setPaymentId}
            />
          ))}
        </div>
      </CheckoutSection>

      <CheckoutSection icon={ClipboardList} title="Order Summary">
        <OrderSummaryCard items={cart.items} />
      </CheckoutSection>

      <OrderTotals
        subtotal={cart.subtotal}
        shipping={cart.shipping}
        discount={cart.discount}
        total={cart.total}
      />

      <Button type="submit" size="lg" className="mt-auto w-full">
        Place Order
      </Button>
    </form>
  );
}
