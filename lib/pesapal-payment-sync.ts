import mongoose from "mongoose";
import { Order } from "../models/Order";
import { Payment } from "../models/Payment";
import { connectToDatabase } from "./mongoose";
import { verifyPayment } from "./pesapal";

export class PesapalSyncError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PesapalSyncError";
    this.status = status;
  }
}

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

export async function syncPesapalPaymentStatus(
  trackingId: string,
  merchantReference?: string,
) {
  await connectToDatabase();

  const verified = await verifyPayment(trackingId);
  const reference = verified.merchantReference ?? merchantReference;

  if (!reference) {
    throw new PesapalSyncError(
      "Missing merchant reference for Pesapal verification.",
      400,
    );
  }

  const session = await mongoose.startSession();

  try {
    const result = await session.withTransaction(async () => {
      const payment = await Payment.findOne({
        provider: "pesapal",
        reference,
      }).session(session);

      if (!payment) {
        throw new PesapalSyncError("Payment not found.", 404);
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

      await payment.save({ session });

      const order = await Order.findOneAndUpdate(
        { paymentId: payment._id },
        { status: orderStatus },
        { new: true, session },
      );

      return {
        reference,
        trackingId,
        paymentStatus,
        orderStatus,
        payment,
        order,
      };
    });

    return result;
  } finally {
    await session.endSession();
  }
}
