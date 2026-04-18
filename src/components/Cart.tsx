import { CartItem } from "@/components/CartItem";

type Item = {
  name: string;
  price: number;
  quantity: number;
};

export const STATIC_CART_ITEMS: Item[] = [
  { name: "Web Development Course", price: 2500, quantity: 1 },
  { name: "UI Kit", price: 1500, quantity: 1 },
  { name: "Hosting Package", price: 1000, quantity: 1 },
];

type CartProps = {
  items?: Item[];
  currency?: string;
};

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function calculateCartTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function Cart({
  items = STATIC_CART_ITEMS,
  currency = "KES",
}: CartProps) {
  const total = calculateCartTotal(items);

  return (
    <section className="space-y-4 rounded-xl border border-border bg-background/80 p-6 shadow-sm">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">Order Summary</h2>
        <p className="text-sm text-muted-foreground">
          Review your pre-populated cart before checkout.
        </p>
      </header>

      <div className="space-y-3">
        {items.map((item) => (
          <CartItem
            key={`${item.name}-${item.price}`}
            name={item.name}
            price={item.price}
            quantity={item.quantity}
            currency={currency}
          />
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="text-lg font-bold text-foreground">
          {formatAmount(total, currency)}
        </span>
      </div>
    </section>
  );
}
