import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "../../../../../../lib/mongoose";
import { verifyPayment } from "../../../../../../lib/pesapal";
import { Order } from "../../../../../../models/Order";
import { Payment } from "../../../../../../models/Payment";

const callbackQuerySchema = z.object({
  orderTrackingId: z.string().optional(),
  OrderTrackingId: z.string().optional(),
  order_tracking_id: z.string().optional(),
  merchantReference: z.string().optional(),
  OrderMerchantReference: z.string().optional(),
  merchant_reference: z.string().optional(),
});

function mapPesapalToPaymentStatus(
  statusCode?: string,
  statusDescription?: string,
): "successful" | "failed" | "pending" | "cancelled" {
  const normalizedCode = statusCode?.toLowerCase();
  const normalizedDescription = statusDescription?.toLowerCase();

  if (
    normalizedCode === "1" ||
    normalizedCode === "completed" ||
    normalizedDescription?.includes("completed") ||
    normalizedDescription?.includes("success")
  ) {
    return "successful";
  }

  if (
    normalizedCode === "cancelled" ||
    normalizedCode === "3" ||
    normalizedDescription?.includes("cancel")
  ) {
    return "cancelled";
  }

  if (
    normalizedCode === "2" ||
    normalizedCode === "failed" ||
    normalizedDescription?.includes("fail") ||
    normalizedDescription?.includes("invalid")
  ) {
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

function extractTrackingId(query: z.infer<typeof callbackQuerySchema>): string {
  return (
    query.orderTrackingId ??
    query.OrderTrackingId ??
    query.order_tracking_id ??
    ""
  );
}

function extractMerchantReference(
  query: z.infer<typeof callbackQuerySchema>,
): string | undefined {
  return (
    query.merchantReference ??
    query.OrderMerchantReference ??
    query.merchant_reference
  );
}

async function processCallback(trackingId: string, merchantReference?: string) {
  await connectToDatabase();

  const verified = await verifyPayment(trackingId);
  const reference = verified.merchantReference ?? merchantReference;

  if (!reference) {
    return NextResponse.json(
      {
        success: false,
        message: "Missing merchant reference for callback verification.",
      },
      { status: 400 },
    );
  }

  const payment = await Payment.findOne({
    provider: "pesapal",
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

  const paymentStatus = mapPesapalToPaymentStatus(
    verified.statusCode,
    verified.statusDescription,
  );
  const orderStatus = mapPaymentToOrderStatus(paymentStatus);

  payment.status = paymentStatus;
  payment.rawResponse = verified.rawResponse;

  if (typeof verified.amount === "number") {
    payment.amount = verified.amount;
  }

  if (typeof verified.currency === "string") {
    payment.currency = verified.currency.toUpperCase();
  }

  await payment.save();

  const order = await Order.findOneAndUpdate(
    { paymentId: payment._id },
    { status: orderStatus },
    { new: true },
  );

  console.info("Pesapal payment callback processed", {
    paymentId: payment._id.toString(),
    orderId: order?._id.toString() ?? null,
    reference,
    trackingId,
    paymentStatus,
    orderStatus,
  });

  return NextResponse.json({
    success: true,
    data: {
      reference,
      trackingId,
      paymentStatus,
      orderStatus,
      payment,
      order,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const query = callbackQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    );

    const trackingId = extractTrackingId(query);

    if (!trackingId) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing orderTrackingId in callback query.",
        },
        { status: 400 },
      );
    }

    return await processCallback(trackingId, extractMerchantReference(query));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid Pesapal callback query.",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    console.error("Failed to process Pesapal callback", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to process Pesapal callback.",
      },
      { status: 500 },
    );
  }
}
