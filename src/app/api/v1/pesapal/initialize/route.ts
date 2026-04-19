import { randomUUID } from "node:crypto";
import { isAxiosError } from "axios";
import mongoose from "mongoose";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "@/lib/mongoose";
import { initializePayment } from "@/lib/pesapal";
import { resolvePesapalNotificationId } from "@/lib/pesapal-ipn";
import { Order } from "@/models/Order";
import { Payment } from "@/models/Payment";
import { adjustAmount } from "@/lib/config";

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

    const session = await mongoose.startSession();

    try {
      const result = await session.withTransaction(async () => {
        const reference = createPesapalReference();

        const [payment] = await Payment.create(
          [
            {
              provider: "pesapal",
              reference,
              amount: adjustAmount(totalAmount),
              currency: payload.currency.toUpperCase(),
              status: "pending",
              rawResponse: null,
            },
          ],
          { session },
        );

        const [order] = await Order.create(
          [
            {
              items: payload.items,
              totalAmount: adjustAmount(totalAmount),
              status: "pending",
              paymentProvider: "pesapal",
              paymentId: payment._id,
            },
          ],
          { session },
        );

        try {
          const origin = request.nextUrl.origin;
          const defaultCallbackUrl = `${origin}/api/v1/pesapal/callback`;

          const { notificationId, source: notificationSource } =
            await resolvePesapalNotificationId();

          const initialized = await initializePayment({
            reference,
            amount: adjustAmount(totalAmount),
            currency: payload.currency.toUpperCase(),
            description: buildDescription(payload.items, payload.description),
            callbackUrl: payload.callbackUrl || defaultCallbackUrl,
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
          await payment.save({ session });

          console.info("Pesapal payment initialized", {
            orderId: order._id.toString(),
            paymentId: payment._id.toString(),
            reference,
            orderTrackingId: initialized.orderTrackingId,
            notificationSource,
          });

          return {
            success: true,
            data: {
              orderId: order._id,
              paymentId: payment._id,
              reference,
              orderTrackingId: initialized.orderTrackingId,
              redirectUrl: initialized.redirectUrl,
            },
          };
        } catch (error) {
          // If initializePayment fails, we still want to save the failed state
          // but if we are in a transaction, we might want to let it ROLLBACK 
          // to keep the DB clean of failed attempts.
          // For now, we will re-throw here to trigger the outer catch 
          // which will report the error but the transaction will rollback.
          throw error;
        }
      });

      return NextResponse.json(result, { status: 201 });
    } catch (error) {
      console.error("Pesapal initialization failed (Transaction Rolled Back)", error);

      let status = 502;
      let detailedMessage = "Failed to initialize Pesapal checkout.";
      let details: unknown = null;

      if (isAxiosError(error)) {
        status = error.response?.status ?? 502;
        details = error.response?.data;
        const axiosMessage =
          typeof details === "object" && details !== null && "message" in details
            ? String(details.message)
            : error.message;
        detailedMessage = `Pesapal API error: ${axiosMessage}`;
      } else if (error instanceof z.ZodError) {
        detailedMessage = "Internal validation error during Pesapal initialization.";
        details = error.issues;
      } else if (error instanceof Error) {
        detailedMessage = error.message;
      }

      return NextResponse.json(
        {
          success: false,
          message: detailedMessage,
          details,
        },
        { status },
      );
    } finally {
      await session.endSession();
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
