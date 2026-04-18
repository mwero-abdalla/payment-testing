"use client";

import { useMemo, useState } from "react";

import { Cart, calculateCartTotal, STATIC_CART_ITEMS } from "@/components/Cart";
import { CheckoutButton } from "@/components/CheckoutButton";

type InitializePaystackResponse = {
  success: boolean;
  message?: string;
  data?: {
    authorizationUrl: string;
    reference: string;
  };
};

const DEFAULT_EMAIL = "customer@example.com";

export default function PaystackPage() {
  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(() => calculateCartTotal(STATIC_CART_ITEMS), []);

  async function handleCheckout() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/paystack/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          items: STATIC_CART_ITEMS,
          currency: "KES",
        }),
      });

      const result = (await response.json()) as InitializePaystackResponse;

      if (!response.ok || !result.success || !result.data?.authorizationUrl) {
        throw new Error(
          result.message ?? "Unable to initialize Paystack checkout.",
        );
      }

      window.location.href = result.data.authorizationUrl;
    } catch (checkoutError) {
      const message =
        checkoutError instanceof Error
          ? checkoutError.message
          : "Unable to start checkout.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Paystack Checkout
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Pay with Paystack</h1>
        <p className="text-sm text-muted-foreground">
          Confirm your cart and continue to secure payment.
        </p>
      </header>

      <Cart items={STATIC_CART_ITEMS} currency="KES" />

      <section className="space-y-4 rounded-xl border border-border bg-card p-6">
        <div className="space-y-2">
          <label htmlFor="paystack-email" className="text-sm font-medium">
            Email address
          </label>
          <input
            id="paystack-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="customer@example.com"
            required
          />
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Cart total</span>
          <span className="font-semibold text-foreground">
            KES {total.toFixed(2)}
          </span>
        </div>

        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <CheckoutButton
          onClick={handleCheckout}
          isLoading={isLoading}
          disabled={!email}
          label="Proceed to Paystack"
        />
      </section>
    </main>
  );
}
