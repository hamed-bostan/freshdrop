import type { Order } from "@/src/domain/entities/Order";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { SearchBar } from "@/src/presentation/components/SearchBar";
import { OrdersBrowser, OrdersEmptyState } from "./components";

interface OrdersScreenProps {
  orders: Order[];
}

export default function OrdersScreen({ orders }: OrdersScreenProps) {
  return (
    <div className="flex min-h-dvh flex-col gap-6 px-6 pb-24">
      <PageHeader title="My Order" />

      <SearchBar />

      {orders.length > 0 ? <OrdersBrowser orders={orders} /> : <OrdersEmptyState />}
    </div>
  );
}
