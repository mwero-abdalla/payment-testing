"use client";

import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  CreditCard,
  History,
  RefreshCcw,
  ShoppingBag,
  TrendingUp,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

type Payment = {
  _id: string;
  provider: "paystack" | "pesapal";
  reference: string;
  amount: number;
  currency: string;
  status: "pending" | "initialized" | "successful" | "failed" | "cancelled";
  createdAt?: string;
};

type OrderItem = {
  name: string;
  price: number;
  quantity: number;
};

type Order = {
  _id: string;
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "paid" | "failed" | "cancelled";
  paymentProvider: "paystack" | "pesapal";
  paymentId?:
    | {
        _id?: string;
        reference?: string;
        status?: string;
      }
    | string
    | null;
  createdAt?: string;
};

type ApiListResponse<T> = {
  success: boolean;
  message?: string;
  data?: T[];
};

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currency || "KES",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date?: string): string {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function getPaymentReference(order: Order): string {
  if (!order.paymentId) {
    return "-";
  }

  if (typeof order.paymentId === "string") {
    return order.paymentId;
  }

  return order.paymentId.reference ?? order.paymentId._id ?? "-";
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [ordersResponse, paymentsResponse] = await Promise.all([
        fetch("/api/v1/orders"),
        fetch("/api/v1/payments"),
      ]);

      const ordersData =
        (await ordersResponse.json()) as ApiListResponse<Order>;
      const paymentsData =
        (await paymentsResponse.json()) as ApiListResponse<Payment>;

      if (!ordersResponse.ok || !ordersData.success) {
        throw new Error(ordersData.message ?? "Failed to fetch orders.");
      }

      if (!paymentsResponse.ok || !paymentsData.success) {
        throw new Error(paymentsData.message ?? "Failed to fetch payments.");
      }

      setOrders(ordersData.data ?? []);
      setPayments(paymentsData.data ?? []);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load dashboard data.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboardData();
  }, []);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const paidOrders = orders.filter((o) => o.status === "paid").length;
    const totalRevenue = orders
      .filter((o) => o.status === "paid")
      .reduce((sum, order) => sum + order.totalAmount, 0);
    const pendingAmount = orders
      .filter((o) => o.status === "pending")
      .reduce((sum, order) => sum + order.totalAmount, 0);

    return [
      {
        name: "Total Revenue",
        value: formatMoney(totalRevenue, "KES"),
        icon: TrendingUp,
        description: "Confirmed payments",
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-500/10",
      },
      {
        name: "Conversion Rate",
        value: totalOrders
          ? `${Math.round((paidOrders / totalOrders) * 100)}%`
          : "0%",
        icon: ArrowUpRight,
        description: `${paidOrders} paid out of ${totalOrders}`,
        color: "text-sky-600 dark:text-sky-400",
        bg: "bg-sky-50 dark:bg-sky-500/10",
      },
      {
        name: "Pending Volume",
        value: formatMoney(pendingAmount, "KES"),
        icon: Clock,
        description: "Awaiting confirmation",
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-500/10",
      },
    ];
  }, [orders]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Analytics Dashboard
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Real-time insights across all payment providers.
          </p>
        </div>
        <button
          onClick={() => void loadDashboardData()}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-slate-700 active:scale-95 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          Refresh Data
        </button>
      </header>

      {/* Stats Grid */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-white p-6 shadow-sm dark:bg-slate-900/50"
          >
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl",
                  stat.bg,
                )}
              >
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {stat.name}
                </p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500">{stat.description}</p>
          </div>
        ))}
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-1">
        {/* Orders Table */}
        <section className="rounded-3xl border border-white/10 bg-white shadow-sm dark:bg-slate-900/50">
          <div className="flex items-center justify-between border-b border-white/5 p-6">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-slate-500" />
              <h2 className="text-lg font-semibold">Recent Orders</h2>
            </div>
            <Link
              href="/"
              className="text-xs font-semibold text-sky-500 hover:underline"
            >
              New Checkout
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-slate-500 dark:bg-white/5">
                <tr>
                  <th className="px-6 py-3 font-medium">Order ID</th>
                  <th className="px-6 py-3 font-medium">Details</th>
                  <th className="px-6 py-3 font-medium">Provider</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="h-4 w-full rounded bg-slate-100 dark:bg-white/5" />
                      </td>
                    </tr>
                  ))
                ) : orders.length ? (
                  orders.map((order) => (
                    <tr
                      key={order._id}
                      className="transition-colors hover:bg-slate-50/50 dark:hover:bg-white/5"
                    >
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        #{order._id.slice(-8)}
                      </td>
                      <td className="max-w-[200px] px-6 py-4 truncate text-xs text-slate-600 dark:text-slate-400">
                        {order.items
                          .map((item) => `${item.name} (x${item.quantity})`)
                          .join(", ")}
                      </td>
                      <td className="px-6 py-4 capitalize">
                        <span
                          className={cn(
                            "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
                            order.paymentProvider === "paystack"
                              ? "bg-sky-500/10 text-sky-600"
                              : "bg-amber-500/10 text-amber-600",
                          )}
                        >
                          {order.paymentProvider}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4 font-bold">
                        {formatMoney(order.totalAmount, "KES")}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      No orders recorded yet. Start a test transaction to see
                      data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Payments Section */}
        <section className="rounded-3xl border border-white/10 bg-white shadow-sm dark:bg-slate-900/50">
          <div className="flex items-center gap-2 border-b border-white/5 p-6">
            <CreditCard className="h-5 w-5 text-slate-500" />
            <h2 className="text-lg font-semibold">Payment Logs</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-slate-500 dark:bg-white/5">
                <tr>
                  <th className="px-6 py-3 font-medium">Reference</th>
                  <th className="px-6 py-3 font-medium">Provider</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Synced At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? null : payments.length ? (
                  payments.map((payment) => (
                    <tr
                      key={payment._id}
                      className="transition-colors hover:bg-slate-50/50 dark:hover:bg-white/5"
                    >
                      <td className="px-6 py-4 font-mono text-xs">
                        {payment.reference}
                      </td>
                      <td className="px-6 py-4 uppercase text-[10px] font-bold">
                        {payment.provider}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={payment.status} />
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        {formatMoney(payment.amount, payment.currency)}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {formatDate(payment.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      No payment logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
