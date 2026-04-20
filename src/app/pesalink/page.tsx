"use client";

import { useMemo, useState } from "react";
import { Wallet, ShieldCheck, User, Mail, Phone, ArrowLeft } from "lucide-react";
import { Cart, calculateCartTotal, STATIC_CART_ITEMS } from "@/components/Cart";
import { CheckoutButton } from "@/components/CheckoutButton";
import { CheckoutStatus } from "@/components/CheckoutStatus";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-[1fr_450px]">
        {/* Left Column: Form & Header */}
        <div className="flex flex-col gap-8">
          <header className="space-y-4">
             <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <Wallet className="h-3 w-3" />
              Pesapal V3 Integration
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              Checkout with <span className="text-amber-500">Pesapal.</span>
            </h1>
            <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-400">
              Provide your details to continue to the secure payment portal. Pesapal supports mobile money and cards in East Africa.
            </p>
          </header>

          <Suspense fallback={<div className="h-24 w-full animate-pulse rounded-2xl bg-slate-100 dark:bg-white/5" />}>
            <CheckoutStatus />
          </Suspense>

          <section className="rounded-[2.5rem] border border-white/10 bg-white p-8 shadow-sm dark:bg-slate-900/50 sm:p-10">
            <h2 className="mb-8 flex items-center gap-2 text-xl font-bold">
              <User className="h-5 w-5 text-amber-500" />
              Billing Information
            </h2>
            
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="pesapal-first-name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  First name
                </label>
                <input
                  id="pesapal-first-name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-all focus:border-amber-500 dark:border-white/10 dark:bg-white/5 dark:focus:border-amber-400"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="pesapal-last-name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Last name
                </label>
                <input
                  id="pesapal-last-name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-all focus:border-amber-500 dark:border-white/10 dark:bg-white/5 dark:focus:border-amber-400"
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="pesapal-email" className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Mail className="h-4 w-4" />
                  Email address
                </label>
                <input
                  id="pesapal-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-all focus:border-amber-500 dark:border-white/10 dark:bg-white/5 dark:focus:border-amber-400"
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="pesapal-phone" className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Phone className="h-4 w-4" />
                  Phone number
                </label>
                <input
                  id="pesapal-phone"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-all focus:border-amber-500 dark:border-white/10 dark:bg-white/5 dark:focus:border-amber-400"
                  placeholder="+254..."
                  required
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Cart Summary */}
        <aside className="relative">
          <div className="sticky top-24 space-y-6">
            <section className="rounded-[2.5rem] border border-white/10 bg-slate-900 p-8 text-white shadow-2xl dark:bg-black/40">
              <h2 className="mb-6 text-2xl font-bold">Order Summary</h2>
              
              <div className="mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                <Cart items={STATIC_CART_ITEMS} currency="KES" variant="minimal" />
              </div>

              <div className="space-y-4 border-t border-white/10 pt-6">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Total Amount</span>
                  <span className="text-2xl font-bold text-amber-500">KES {total.toFixed(2)}</span>
                </div>

                {error ? (
                  <div className="rounded-xl bg-rose-500/10 p-3 text-xs text-rose-400">
                    {error}
                  </div>
                ) : null}

                <CheckoutButton
                  onClick={handleCheckout}
                  isLoading={isLoading}
                  disabled={!email || !firstName || !lastName || !phoneNumber}
                  label="Generate Payment Link"
                  className="w-full bg-amber-500 py-6 text-base text-slate-900 hover:bg-amber-400 font-bold"
                />

                <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-slate-500">
                  <ShieldCheck className="h-3 w-3" />
                  Secured by Pesapal
                </div>
              </div>
            </section>
            
            <Link 
              href="/paystack" 
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 p-4 text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
            >
              <ArrowLeft className="h-4 w-4" />
              Switch to Paystack instead
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
