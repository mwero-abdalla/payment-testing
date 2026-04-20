import Link from "next/link";
import { CreditCard, Wallet, LayoutDashboard, ArrowRight, ShieldCheck, Zap, BarChart3 } from "lucide-react";

export default function Home() {
  return (
    <div className="relative isolate">
      {/* Background Orbs */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#38bdf8] to-[#fbbf24] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-8 flex justify-center">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-slate-600 ring-1 ring-slate-900/10 hover:ring-slate-900/20 dark:text-slate-400 dark:ring-white/10 dark:hover:ring-white/20">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Sandbox Mode</span> active for all providers.{" "}
              <Link href="/dashboard" className="font-semibold text-slate-950 dark:text-white">
                <span className="absolute inset-0" aria-hidden="true"></span>
                View analytics <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
            Streamline your payment <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-sky-500">testing workflow.</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">
            A specialized workspace for end-to-end validation of Paystack and Pesapal integrations. Initialize transactions, verify callbacks, and monitor database state in one place.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/paystack"
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Start Paystack Test
            </Link>
            <Link href="/pesalink" className="text-sm font-semibold leading-6 text-slate-900 dark:text-white">
              Try Pesapal <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-24 max-w-7xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Paystack Card */}
            <Link href="/paystack" className="group relative flex flex-col items-start rounded-[2rem] border border-white/10 bg-white p-8 shadow-xl transition-all duration-300 hover:-translate-y-2 dark:bg-slate-900/50 dark:hover:bg-slate-900">
              <div className="mb-6 rounded-2xl bg-sky-500/10 p-4 text-sky-600 dark:text-sky-400">
                <CreditCard className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Paystack Flow</h3>
              <p className="mt-4 text-slate-600 dark:text-slate-400">
                Test initialization, authorization redirects, and transaction verification using Paystack's API.
              </p>
              <div className="mt-8 flex items-center gap-2 text-sm font-bold text-sky-600 dark:text-sky-400">
                Explore Provider <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            {/* Pesapal Card */}
            <Link href="/pesalink" className="group relative flex flex-col items-start rounded-[2rem] border border-white/10 bg-white p-8 shadow-xl transition-all duration-300 hover:-translate-y-2 dark:bg-slate-900/50 dark:hover:bg-slate-900">
              <div className="mb-6 rounded-2xl bg-amber-500/10 p-4 text-amber-600 dark:text-amber-400">
                <Wallet className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Pesapal Checkout</h3>
              <p className="mt-4 text-slate-600 dark:text-slate-400">
                Validate IFrame redirects, IPN registration, and synchronous callback processing for Pesapal V3.
              </p>
              <div className="mt-8 flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400">
                Explore Provider <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            {/* Dashboard Card */}
            <Link href="/dashboard" className="group relative flex flex-col items-start rounded-[2rem] border border-white/10 bg-white p-8 shadow-xl transition-all duration-300 hover:-translate-y-2 dark:bg-slate-900/50 dark:hover:bg-slate-900">
              <div className="mb-6 rounded-2xl bg-emerald-500/10 p-4 text-emerald-600 dark:text-emerald-400">
                <LayoutDashboard className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Live Dashboard</h3>
              <p className="mt-4 text-slate-600 dark:text-slate-400">
                Monitor MongoDB records for orders and payments in real-time. Inspect payment status and metadata.
              </p>
              <div className="mt-8 flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                Analytics Hub <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-32 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex gap-x-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-semibold leading-7 text-slate-900 dark:text-white">End-to-End Validation</h4>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">Every state change is tracked from initialization to final confirmation.</p>
            </div>
          </div>
          <div className="flex gap-x-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-white">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-semibold leading-7 text-slate-900 dark:text-white">Real-time Callbacks</h4>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">Instant visibility into webhook and IPN processing results.</p>
            </div>
          </div>
          <div className="flex gap-x-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-semibold leading-7 text-slate-900 dark:text-white">Detailed Logs</h4>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">Access provider response payloads directly from the database.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
