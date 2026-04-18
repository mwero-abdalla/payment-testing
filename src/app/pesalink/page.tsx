"use client";

import { useMemo, useState } from "react";

import { Cart, calculateCartTotal, STATIC_CART_ITEMS } from "@/components/Cart";
import { CheckoutButton } from "@/components/CheckoutButton";

type InitializePesapalResponse = {
  success: boolean;
  message?: string;
  data?: {
    redirectUrl: string;
    reference: string;
    orderTrackingId: string;
  };
};

const DEFAULT_FORM = {
  email: "customer@example.com",
  firstName: "Jane",
  lastName: "Doe",
  phoneNumber: "+254700000000",
};

export default function PesalinkPage() {
  const [email, setEmail] = useState(DEFAULT_FORM.email);
  const [firstName, setFirstName] = useState(DEFAULT_FORM.firstName);
  const [lastName, setLastName] = useState(DEFAULT_FORM.lastName);
  const [phoneNumber, setPhoneNumber] = useState(DEFAULT_FORM.phoneNumber);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(() => calculateCartTotal(STATIC_CART_ITEMS), []);

  async function handleCheckout() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/pesapal/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          phoneNumber,
          items: STATIC_CART_ITEMS,
          currency: "KES",
        }),
      });

      const result = (await response.json()) as InitializePesapalResponse;

      if (!response.ok || !result.success || !result.data?.redirectUrl) {
        throw new Error(
          result.message ?? "Unable to initialize Pesapal checkout.",
        );
      }

      window.location.href = result.data.redirectUrl;
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
          Pesapal Checkout
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Pay with Pesapal</h1>
        <p className="text-sm text-muted-foreground">
          Confirm your cart and continue to secure payment.
        </p>
      </header>

      <Cart items={STATIC_CART_ITEMS} currency="KES" />

      <section className="space-y-4 rounded-xl border border-border bg-card p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="pesapal-first-name" className="text-sm font-medium">
              First name
            </label>
            <input
              id="pesapal-first-name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="pesapal-last-name" className="text-sm font-medium">
              Last name
            </label>
            <input
              id="pesapal-last-name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="pesapal-email" className="text-sm font-medium">
              Email address
            </label>
            <input
              id="pesapal-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="pesapal-phone" className="text-sm font-medium">
              Phone number
            </label>
            <input
              id="pesapal-phone"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div>
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
          disabled={!email || !firstName || !lastName || !phoneNumber}
          label="Proceed to Pesapal"
        />
      </section>
    </main>
  );
}
