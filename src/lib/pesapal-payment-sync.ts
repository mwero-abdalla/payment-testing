import mongoose from "mongoose";
import { Order } from "@/models/Order";
import { Payment } from "@/models/Payment";
import { connectToDatabase } from "@/lib/mongoose";
import { PaymentGateway } from "@/lib/payments/gateway";

export class PesapalSyncError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PesapalSyncError";
    this.status = status;
  }
}

function mapPaymentToOrderStatus(
  paymentStatus: string,
): "paid" | "failed" | "pending" | "cancelled" {
  if (paymentStatus === "paid" || paymentStatus === "successful") {
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

  const verified = await PaymentGateway.pesapal().verify(trackingId);
  const reference = verified.reference || merchantReference;

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

      const orderStatus = mapPaymentToOrderStatus(verified.status);

      payment.status = verified.status as any;
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
        { returnDocument: "after", session },
      );

      console.info("Pesapal payment callback processed", {
        paymentId: payment._id.toString(),
        orderId: order?._id.toString() ?? null,
        reference,
        trackingId,
        paymentStatus: verified.status,
        orderStatus,
      });

      return {
        reference,
        trackingId,
        paymentStatus: verified.status,
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
