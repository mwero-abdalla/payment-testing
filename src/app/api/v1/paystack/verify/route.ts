import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "@/lib/mongoose";
import { verifyTransaction } from "@/lib/paystack";
import { Order } from "@/models/Order";
import { Payment } from "@/models/Payment";

const verifyPaystackSchema = z.object({
  reference: z.string().min(1),
});

function mapPaystackToPaymentStatus(
  status: string,
): "successful" | "failed" | "pending" | "cancelled" {
  const normalized = status.toLowerCase();

  if (normalized === "success") {
    return "successful";
  }

  if (normalized === "abandoned" || normalized === "cancelled") {
    return "cancelled";
  }

  if (normalized === "failed" || normalized === "reversed") {
    return "failed";
  }

  return "pending";
}

function mapPaymentToOrderStatus(
  paymentStatus: "successful" | "failed" | "pending" | "cancelled",
): "paid" | "failed" | "pending" | "cancelled" {
  if (paymentStatus === "successful") {
    return "paid";
  }

  if (paymentStatus === "cancelled") {
    return "cancelled";
  }

  if (paymentStatus === "failed") {
    return "failed";
  }

  return "pending";
}

async function verifyByReference(reference: string) {
  await connectToDatabase();

  const payment = await Payment.findOne({
    provider: "paystack",
    reference,
  });

  if (!payment) {
    return NextResponse.json(
      {
        success: false,
        message: "Payment not found.",
      },
      { status: 404 },
    );
  }

  const verified = await verifyTransaction(reference);
  const paymentStatus = mapPaystackToPaymentStatus(verified.status);
  const orderStatus = mapPaymentToOrderStatus(paymentStatus);

  payment.status = paymentStatus;
  payment.rawResponse = verified.rawResponse;
  payment.amount = verified.amount;
  payment.currency = verified.currency.toUpperCase();
  await payment.save();

  const order = await Order.findOneAndUpdate(
    { paymentId: payment._id },
    { status: orderStatus },
    { returnDocument: "after" },
  );

  console.info("Paystack payment verified", {
    paymentId: payment._id.toString(),
    orderId: order?._id.toString() ?? null,
    reference,
    paymentStatus,
    orderStatus,
  });

  return {
    reference,
    paymentStatus,
    orderStatus,
    payment,
    order,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = verifyPaystackSchema.parse(body);

    const result = await verifyByReference(payload.reference);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid Paystack verification payload.",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    console.error("Failed to verify Paystack payment", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to verify Paystack payment.",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const payload = verifyPaystackSchema.parse({
      reference: request.nextUrl.searchParams.get("reference"),
    });

    const synced = await verifyByReference(payload.reference);

    const redirectUrl = new URL("/paystack", request.url);
    redirectUrl.searchParams.set("status", synced.orderStatus);
    redirectUrl.searchParams.set("orderId", synced.order?._id.toString() || "");

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid Paystack verification query.",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    console.error("Failed to verify Paystack payment", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to verify Paystack payment.",
      },
      { status: 500 },
    );
  }
}
