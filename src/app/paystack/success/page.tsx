"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle2, ChevronRight, LayoutDashboard, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 rounded-full bg-emerald-50 p-4 dark:bg-emerald-500/10">
        <CheckCircle2 className="h-16 w-16 text-emerald-600 dark:text-emerald-400" />
      </div>

      <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
        Payment Successful
      </p>
      <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
        Thank you for your purchase!
      </h1>
      <p className="max-w-md text-lg text-muted-foreground">
        We've received your payment. Your order is now being processed and you'll receive a confirmation email shortly.
      </p>

      {orderId && (
        <div className="mt-8 rounded-2xl border border-border bg-muted/50 px-6 py-3 font-mono text-sm shadow-sm">
          <span className="text-muted-foreground">Order ID:</span>{" "}
          <span className="font-semibold text-foreground">{orderId}</span>
        </div>
      )}

      <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row">
        <Link
          href="/dashboard"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-8 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        >
          <LayoutDashboard className="h-4 w-4" />
          View in Dashboard
        </Link>
        <Link
          href="/"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-8 text-sm font-medium text-slate-900 transition-all hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <ShoppingBag className="h-4 w-4" />
          Return to Store
        </Link>
      </div>

      <div className="mt-16 w-full max-w-2xl border-t border-border pt-8">
        <div className="flex items-center justify-between text-left">
          <div className="space-y-1">
            <h3 className="font-semibold">Next steps</h3>
            <p className="text-sm text-muted-foreground">
              You can track your order status and view transaction details in your dashboard at any time.
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

export default function PaystackSuccessPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.05),_transparent_40%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.05),_transparent_40%)]">
      <div className="mx-auto max-w-4xl px-4 py-20 sm:py-32">
        <Suspense fallback={
          <div className="flex animate-pulse flex-col items-center">
            <div className="mb-6 h-24 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-10 w-64 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        }>
          <SuccessContent />
        </Suspense>
      </div>
    </main>
  );
}
