import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-[calc(100vh-0px)] overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.06),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(217,119,6,0.10),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_56%,_#f8fafc_100%)] text-slate-950 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.10),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.10),_transparent_26%),linear-gradient(180deg,_#020617_0%,_#0f172a_56%,_#111827_100%)] dark:text-slate-50">
      <div className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[linear-gradient(90deg,_rgba(14,165,233,0.12),_rgba(245,158,11,0.12),_rgba(239,68,68,0.08))] blur-3xl dark:bg-[linear-gradient(90deg,_rgba(56,189,248,0.16),_rgba(251,191,36,0.16),_rgba(249,115,22,0.12))]" />

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-6 rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-white/10 dark:bg-slate-950/70 md:p-10">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
              Payment testing workspace
            </span>
            <span>Next.js 16</span>
            <span>MongoDB</span>
            <span>Paystack + Pesapal</span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div className="space-y-5">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                A payment sandbox for testing Paystack and Pesapal flows end to
                end.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
                Use this app to initialize payments, verify transactions, track
                orders in MongoDB, and inspect the exact request and callback
                flow for each provider.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/paystack"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition-transform hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  Open Paystack
                </Link>
                <Link
                  href="/pesalink"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-medium text-slate-900 transition-transform hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  Open Pesapal
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-transparent px-5 text-sm font-medium text-slate-600 transition-transform hover:-translate-y-0.5 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                >
                  View dashboard
                </Link>
              </div>
            </div>

            <aside className="grid gap-3 rounded-[1.5rem] border border-slate-200/80 bg-slate-50 p-4 text-sm shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-950/70">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  Transaction model
                </p>
                <p className="mt-2 text-lg font-semibold">
                  Order, payment, verification
                </p>
                <p className="mt-1 leading-6 text-slate-600 dark:text-slate-300">
                  Every checkout creates records before provider redirection so
                  you can inspect the lifecycle at any point.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/70">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                    Paystack
                  </p>
                  <p className="mt-2 font-medium">Initialize and verify</p>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">
                    Redirect to authorization and confirm with the verify route.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/70">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                    Pesapal
                  </p>
                  <p className="mt-2 font-medium">Callback + IPN sync</p>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">
                    Support browser return, webhook processing, and IPN
                    registration.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              1. Checkout pages
            </p>
            <h2 className="mt-2 text-xl font-semibold">Try each provider</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              The `/paystack` and `/pesalink` pages are ready for test runs and
              use the same cart data so comparisons stay simple.
            </p>
          </article>

          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              2. API routes
            </p>
            <h2 className="mt-2 text-xl font-semibold">Inspect the flow</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              The initialize, verify, callback, webhook, and IPN sync routes are
              exposed for development and troubleshooting.
            </p>
          </article>

          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              3. Dashboard
            </p>
            <h2 className="mt-2 text-xl font-semibold">Review records</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              `/dashboard` lists orders and payments so you can confirm the
              database state after each test transaction.
            </p>
          </article>
        </section>

        <section className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 text-slate-50 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.55)] dark:border-white/10 dark:bg-black/40">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-400">
                What to read next
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Jump into the live payment flows or inspect results.
              </h2>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href="/paystack"
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 font-medium text-white transition hover:bg-white/10"
              >
                Paystack checkout
              </Link>
              <Link
                href="/pesalink"
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 font-medium text-white transition hover:bg-white/10"
              >
                Pesapal checkout
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 font-medium text-white transition hover:bg-white/10"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
