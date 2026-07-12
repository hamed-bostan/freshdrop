import { getTranslations } from "next-intl/server";
import type { Order } from "@/src/domain/entities/Order";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { SearchBar } from "@/src/presentation/components/SearchBar";
import { OrdersBrowser, OrdersEmptyState } from "./components";

interface OrdersScreenProps {
  orders: Order[];
}

export default async function OrdersScreen({ orders }: OrdersScreenProps) {
  const t = await getTranslations("orders");

  return (
    <div className="flex min-h-dvh flex-col gap-6 px-6 pb-24">
      <PageHeader title={t("title")} />

      <SearchBar />

      {orders.length > 0 ? <OrdersBrowser orders={orders} /> : <OrdersEmptyState />}
    </div>
  );
}
