import { randomUUID } from "node:crypto";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "../../../../../../lib/mongoose";
import { initializePayment } from "../../../../../../lib/pesapal";
import { resolvePesapalNotificationId } from "../../../../../../lib/pesapal-ipn";
import { Order } from "../../../../../../models/Order";
import { Payment } from "../../../../../../models/Payment";

const cartItemSchema = z.object({
  name: z.string().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().int().min(1),
});

const initializePesapalSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phoneNumber: z.string().min(1),
  items: z.array(cartItemSchema).min(1),
  currency: z.string().min(3).max(3).default("KES"),
  callbackUrl: z.string().url().optional(),
  description: z.string().min(1).optional(),
});

function createPesapalReference(): string {
  return `pesapal_${Date.now()}_${randomUUID().slice(0, 8)}`;
}

function calculateTotalAmount(
  items: Array<{ price: number; quantity: number }>,
): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function buildDescription(
  items: Array<{ name: string; quantity: number }>,
  fallback?: string,
): string {
  if (fallback) {
    return fallback;
  }

  return items.map((item) => `${item.name} x${item.quantity}`).join(", ");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = initializePesapalSchema.parse(body);

    const totalAmount = calculateTotalAmount(payload.items);

    if (totalAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Order total must be greater than 0.",
        },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const reference = createPesapalReference();

    const payment = await Payment.create({
      provider: "pesapal",
      reference,
      amount: totalAmount,
      currency: payload.currency.toUpperCase(),
      status: "pending",
      rawResponse: null,
    });

    const order = await Order.create({
      items: payload.items,
      totalAmount,
      status: "pending",
      paymentProvider: "pesapal",
      paymentId: payment._id,
    });

    try {
      const { notificationId, source: notificationSource } =
        await resolvePesapalNotificationId();

      const initialized = await initializePayment({
        reference,
        amount: totalAmount,
        currency: payload.currency.toUpperCase(),
        description: buildDescription(payload.items, payload.description),
        callbackUrl: payload.callbackUrl,
        notificationId,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        phoneNumber: payload.phoneNumber,
      });

      payment.status = "initialized";
      payment.rawResponse = {
        ...initialized.rawResponse,
        orderTrackingId: initialized.orderTrackingId,
        merchantReference: initialized.merchantReference,
      };
      await payment.save();

      console.info("Pesapal payment initialized", {
        orderId: order._id.toString(),
        paymentId: payment._id.toString(),
        reference,
        orderTrackingId: initialized.orderTrackingId,
        notificationSource,
      });

      return NextResponse.json(
        {
          success: true,
          data: {
            orderId: order._id,
            paymentId: payment._id,
            reference,
            orderTrackingId: initialized.orderTrackingId,
            redirectUrl: initialized.redirectUrl,
          },
        },
        { status: 201 },
      );
    } catch (error) {
      payment.status = "failed";
      payment.rawResponse = {
        message: "Pesapal initialization failed",
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
              }
            : String(error),
      };
      await payment.save();

      order.status = "failed";
      await order.save();

      console.error("Pesapal initialization failed", error);

      return NextResponse.json(
        {
          success: false,
          message: "Failed to initialize Pesapal checkout.",
        },
        { status: 502 },
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid Pesapal initialize payload.",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Duplicate payment reference generated. Please retry.",
        },
        { status: 409 },
      );
    }

    console.error("Failed to initialize Pesapal payment", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to initialize Pesapal payment.",
      },
      { status: 500 },
    );
  }
}
