import { randomUUID } from "node:crypto";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "@/lib/mongoose";
import { initializeTransaction } from "@/lib/paystack";
import { Order } from "@/models/Order";
import { Payment } from "@/models/Payment";

const cartItemSchema = z.object({
  name: z.string().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().int().min(1),
});

const initializePaystackSchema = z.object({
  email: z.string().email(),
  items: z.array(cartItemSchema).min(1),
  currency: z.string().min(3).max(3).default("KES"),
  callbackUrl: z.string().url().optional(),
});

function calculateTotalAmount(
  items: Array<{ price: number; quantity: number }>,
): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function createPaystackReference(): string {
  return `paystack_${Date.now()}_${randomUUID().slice(0, 8)}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = initializePaystackSchema.parse(body);

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

    const reference = createPaystackReference();

    const payment = await Payment.create({
      provider: "paystack",
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
      paymentProvider: "paystack",
      paymentId: payment._id,
    });

    try {
      const initialized = await initializeTransaction({
        email: payload.email,
        amount: totalAmount,
        reference,
        currency: payload.currency.toUpperCase(),
        callbackUrl: payload.callbackUrl,
        metadata: {
          orderId: order._id.toString(),
          paymentId: payment._id.toString(),
          provider: "paystack",
        },
      });

      payment.status = "initialized";
      payment.rawResponse = initialized.rawResponse;
      await payment.save();

      console.info("Paystack payment initialized", {
        orderId: order._id.toString(),
        paymentId: payment._id.toString(),
        reference,
      });

      return NextResponse.json(
        {
          success: true,
          data: {
            orderId: order._id,
            paymentId: payment._id,
            reference: initialized.reference,
            authorizationUrl: initialized.authorizationUrl,
          },
        },
        { status: 201 },
      );
    } catch (error) {
      payment.status = "failed";
      payment.rawResponse = {
        message: "Paystack initialization failed",
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

      console.error("Paystack initialization failed", error);

      return NextResponse.json(
        {
          success: false,
          message: "Failed to initialize Paystack checkout.",
        },
        { status: 502 },
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid Paystack initialize payload.",
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

    console.error("Failed to initialize Paystack payment", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to initialize Paystack payment.",
      },
      { status: 500 },
    );
  }
}
