"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, AlertCircle, ShoppingCart } from "lucide-react";
import Link from "next/link";

export function CheckoutStatus() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const orderId = searchParams.get("orderId");

  if (!status) {
    return null;
  }

  const isSuccessful = status === "paid" || status === "successful";
  const isCancelled = status === "cancelled";
  const isFailed = status === "failed";

  return (
    <div
      className={`mb-6 rounded-2xl border p-5 shadow-sm transition-all duration-300 ${
        isSuccessful
          ? "border-emerald-200 bg-emerald-50/50 text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200"
          : isCancelled
          ? "border-slate-200 bg-slate-50/80 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
          : "border-rose-200 bg-rose-50/50 text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="mt-1">
          {isSuccessful ? (
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          ) : isCancelled ? (
            <AlertCircle className="h-6 w-6 text-slate-500" />
          ) : (
            <XCircle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
          )}
        </div>

        <div className="flex-1 space-y-1">
          <h3 className="font-semibold leading-tight">
            {isSuccessful
              ? "Payment Successful!"
              : isCancelled
              ? "Payment Cancelled"
              : "Payment Failed"}
          </h3>
          <p className="text-sm opacity-90">
            {isSuccessful
              ? `Your order #${orderId?.slice(-8) || "..."} has been updated. You can view the details in your dashboard.`
              : isCancelled
              ? "The checkout process was cancelled. Your items are still in your cart."
              : "We couldn't process your payment. Please try again or use a different method."}
          </p>
          
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/dashboard"
              className="inline-flex h-8 items-center justify-center rounded-full bg-slate-950 px-4 text-xs font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              Go to Dashboard
            </Link>
            {!isSuccessful && (
               <button
                 onClick={() => window.history.replaceState({}, '', window.location.pathname)}
                 className="inline-flex h-8 items-center justify-center rounded-full border border-current px-4 text-xs font-medium opacity-70 transition hover:opacity-100"
               >
                 Dismiss
               </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
