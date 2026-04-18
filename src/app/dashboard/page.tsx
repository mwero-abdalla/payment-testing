"use client";

import { useEffect, useMemo, useState } from "react";

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
    currency,
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

  useEffect(() => {
    let active = true;

    async function loadDashboardData() {
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

        if (!active) {
          return;
        }

        setOrders(ordersData.data ?? []);
        setPayments(paymentsData.data ?? []);
      } catch (fetchError) {
        if (!active) {
          return;
        }

        const message =
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load dashboard data.";
        setError(message);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboardData();

    return () => {
      active = false;
    };
  }, []);

  const totalOrdersAmount = useMemo(
    () => orders.reduce((sum, order) => sum + order.totalAmount, 0),
    [orders],
  );

  const totalPaymentsAmount = useMemo(
    () => payments.reduce((sum, payment) => sum + payment.amount, 0),
    [payments],
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Dashboard
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          Orders and Payments
        </h1>
        <p className="text-sm text-muted-foreground">
          Monitor all recorded orders and payment transactions.
        </p>
      </header>

      {isLoading ? (
        <section className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading dashboard data...
        </section>
      ) : null}

      {error ? (
        <section className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
          {error}
        </section>
      ) : null}

      {!isLoading && !error ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{orders.length}</p>
              <p className="text-sm text-muted-foreground">
                Value: {formatMoney(totalOrdersAmount, "KES")}
              </p>
            </article>

            <article className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">Total Payments</p>
              <p className="text-2xl font-bold">{payments.length}</p>
              <p className="text-sm text-muted-foreground">
                Value: {formatMoney(totalPaymentsAmount, "KES")}
              </p>
            </article>
          </section>

          <section className="space-y-3 rounded-xl border border-border bg-card p-4">
            <h2 className="text-xl font-semibold">Orders</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Order ID</th>
                    <th className="px-3 py-2 font-medium">Items</th>
                    <th className="px-3 py-2 font-medium">Provider</th>
                    <th className="px-3 py-2 font-medium">Payment Ref</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Amount</th>
                    <th className="px-3 py-2 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length ? (
                    orders.map((order) => (
                      <tr key={order._id} className="border-b border-border/60">
                        <td className="px-3 py-2 align-top font-mono text-xs">
                          {order._id}
                        </td>
                        <td className="px-3 py-2 align-top text-xs text-muted-foreground">
                          {order.items
                            .map((item) => `${item.name} x${item.quantity}`)
                            .join(", ")}
                        </td>
                        <td className="px-3 py-2 align-top uppercase">
                          {order.paymentProvider}
                        </td>
                        <td className="px-3 py-2 align-top text-xs">
                          {getPaymentReference(order)}
                        </td>
                        <td className="px-3 py-2 align-top capitalize">
                          {order.status}
                        </td>
                        <td className="px-3 py-2 align-top font-semibold">
                          {formatMoney(order.totalAmount, "KES")}
                        </td>
                        <td className="px-3 py-2 align-top text-xs text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-3 py-5 text-center text-muted-foreground"
                      >
                        No orders found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-3 rounded-xl border border-border bg-card p-4">
            <h2 className="text-xl font-semibold">Payments</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Payment ID</th>
                    <th className="px-3 py-2 font-medium">Provider</th>
                    <th className="px-3 py-2 font-medium">Reference</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Amount</th>
                    <th className="px-3 py-2 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length ? (
                    payments.map((payment) => (
                      <tr
                        key={payment._id}
                        className="border-b border-border/60"
                      >
                        <td className="px-3 py-2 align-top font-mono text-xs">
                          {payment._id}
                        </td>
                        <td className="px-3 py-2 align-top uppercase">
                          {payment.provider}
                        </td>
                        <td className="px-3 py-2 align-top text-xs">
                          {payment.reference}
                        </td>
                        <td className="px-3 py-2 align-top capitalize">
                          {payment.status}
                        </td>
                        <td className="px-3 py-2 align-top font-semibold">
                          {formatMoney(
                            payment.amount,
                            payment.currency || "KES",
                          )}
                        </td>
                        <td className="px-3 py-2 align-top text-xs text-muted-foreground">
                          {formatDate(payment.createdAt)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-5 text-center text-muted-foreground"
                      >
                        No payments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
