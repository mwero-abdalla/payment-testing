"use client";

import { ArrowRight, CreditCard, Mail, ShieldCheck } from "lucide-react";
import { Suspense, useMemo, useState } from "react";
import { Cart, calculateCartTotal, STATIC_CART_ITEMS } from "@/components/Cart";
import { CheckoutButton } from "@/components/CheckoutButton";
import { CheckoutStatus } from "@/components/CheckoutStatus";
import { cn } from "@/lib/utils";

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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
        {/* Left Column: Header & Status */}
        <div className="flex flex-col gap-8">
          <header className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              <CreditCard className="h-3 w-3" />
              Paystack Integration
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              Complete your <span className="text-sky-500">purchase.</span>
            </h1>
            <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-400">
              You are using the Paystack sandbox environment. No real funds will
              be deducted during this test.
            </p>
          </header>

          <Suspense
            fallback={
              <div className="h-24 w-full animate-pulse rounded-2xl bg-slate-100 dark:bg-white/5" />
            }
          >
            <CheckoutStatus />
          </Suspense>

          <section className="rounded-[2rem] border border-white/10 bg-white p-8 shadow-sm dark:bg-slate-900/50">
            <h2 className="mb-6 text-xl font-bold">Review Items</h2>
            <Cart items={STATIC_CART_ITEMS} currency="KES" />
          </section>
        </div>

        {/* Right Column: Checkout Form */}
        <aside className="relative">
          <div className="sticky top-24 space-y-6">
            <section className="rounded-[2rem] border border-white/10 bg-slate-900 p-8 text-white shadow-2xl dark:bg-black/40">
              <h2 className="mb-8 text-2xl font-bold">Checkout</h2>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label
                    htmlFor="paystack-email"
                    className="flex items-center gap-2 text-sm font-medium text-slate-300"
                  >
                    <Mail className="h-4 w-4" />
                    Billing Email
                  </label>
                  <div className="relative">
                    <input
                      id="paystack-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="h-12 w-full rounded-2xl border-white/10 bg-white/5 px-4 text-sm outline-none transition-all placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500"
                      placeholder="customer@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4 border-t border-white/10 pt-6">
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Subtotal</span>
                    <span>KES {total.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Tax</span>
                    <span>KES 0.00</span>
                  </div>
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total Amount</span>
                    <span className="text-sky-400">KES {total.toFixed(2)}</span>
                  </div>
                </div>

                {error ? (
                  <div className="rounded-xl bg-rose-500/10 p-3 text-xs text-rose-400">
                    {error}
                  </div>
                ) : null}

                <CheckoutButton
                  onClick={handleCheckout}
                  isLoading={isLoading}
                  disabled={!email}
                  label="Initialize Payment"
                  className="w-full bg-sky-500 py-6 text-base hover:bg-sky-400"
                />

                <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-slate-500">
                  <ShieldCheck className="h-3 w-3" />
                  Secured by Paystack
                </div>
              </div>
            </section>

            <div className="rounded-[2rem] border border-white/10 bg-white p-6 shadow-sm dark:bg-slate-900/50">
              <h4 className="mb-2 text-sm font-bold">Test Credentials</h4>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                In the Paystack popup, use any of the test cards provided in
                their documentation to simulate successful or failed payments.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
