import mongoose from "mongoose";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "@/lib/mongoose";
import { Payment } from "@/models/Payment";

const updatePaymentSchema = z
  .object({
    provider: z.enum(["paystack", "pesapal"]).optional(),
    reference: z.string().min(1).optional(),
    amount: z.number().positive().optional(),
    currency: z.string().min(3).max(3).optional(),
    status: z
      .enum(["pending", "initialized", "successful", "failed", "cancelled"])
      .optional(),
    rawResponse: z.unknown().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment id.",
        },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const payment = await Payment.findById(id);

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("Failed to fetch payment", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch payment.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment id.",
        },
        { status: 400 },
      );
    }

    const body = await request.json();
    const payload = updatePaymentSchema.parse(body);

    await connectToDatabase();

    const updateDoc: Record<string, unknown> = {
      ...payload,
    };

    if (typeof payload.currency === "string") {
      updateDoc.currency = payload.currency.toUpperCase();
    }

    const payment = await Payment.findByIdAndUpdate(id, updateDoc, {
      returnDocument: "after",
      runValidators: true,
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

    console.info("Payment updated", {
      paymentId: payment._id.toString(),
      reference: payment.reference,
      status: payment.status,
    });

    return NextResponse.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment update payload.",
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
          message: "Payment reference already exists.",
        },
        { status: 409 },
      );
    }

    console.error("Failed to update payment", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update payment.",
      },
      { status: 500 },
    );
  }
}
