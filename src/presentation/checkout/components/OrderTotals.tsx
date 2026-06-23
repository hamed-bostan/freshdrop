interface OrderTotalsProps {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
}

const money = (amount: number) => `$ ${amount.toFixed(2)}`;

/**
 * The price breakdown: subtotal, delivery fee and discount (each underlined),
 * then the emphasized total payment.
 */
export function OrderTotals({ subtotal, shipping, discount, total }: OrderTotalsProps) {
  const rows = [
    { label: "Subtotal", value: money(subtotal) },
    { label: "Delivery Fee", value: money(shipping) },
    { label: "Discount", value: money(discount) },
  ];

  return (
    <div className="flex w-full flex-col gap-2 px-4 py-2">
      <dl className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-4 text-body-b6">
              <dt className="text-foreground">{row.label}</dt>
              <dd className="text-muted-foreground">{row.value}</dd>
            </div>
            <div className="h-px w-full bg-border" aria-hidden />
          </div>
        ))}
      </dl>

      <div className="flex items-center justify-between gap-4">
        <span className="text-body-b7 text-foreground">Total Payment</span>
        <span className="text-body-b6 text-foreground">{money(total)}</span>
      </div>
    </div>
  );
}
