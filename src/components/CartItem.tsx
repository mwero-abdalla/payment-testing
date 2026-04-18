type CartItemProps = {
  name: string;
  price: number;
  quantity: number;
  currency?: string;
};

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function CartItem({
  name,
  price,
  quantity,
  currency = "KES",
}: CartItemProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
      <div>
        <p className="font-medium text-card-foreground">{name}</p>
        <p className="text-sm text-muted-foreground">Qty: {quantity}</p>
      </div>

      <div className="text-right">
        <p className="text-sm text-muted-foreground">
          {formatAmount(price, currency)} x {quantity}
        </p>
        <p className="font-semibold text-card-foreground">
          {formatAmount(price * quantity, currency)}
        </p>
      </div>
    </div>
  );
}
