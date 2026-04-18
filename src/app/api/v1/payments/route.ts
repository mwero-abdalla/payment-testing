import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "../../../../../lib/mongoose";
import { Payment } from "../../../../../models/Payment";

const createPaymentSchema = z.object({
  provider: z.enum(["paystack", "pesapal"]),
  reference: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(3).max(3).default("KES"),
  status: z
    .enum(["pending", "initialized", "successful", "failed", "cancelled"])
    .optional(),
  rawResponse: z.unknown().optional(),
});

const listQuerySchema = z.object({
  provider: z.enum(["paystack", "pesapal"]).optional(),
  status: z
    .enum(["pending", "initialized", "successful", "failed", "cancelled"])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = createPaymentSchema.parse(body);

    await connectToDatabase();

    const payment = await Payment.create({
      provider: payload.provider,
      reference: payload.reference,
      amount: payload.amount,
      currency: payload.currency.toUpperCase(),
      status: payload.status ?? "pending",
      rawResponse: payload.rawResponse ?? null,
    });

    console.info("Payment created", {
      paymentId: payment._id.toString(),
      reference: payment.reference,
      provider: payment.provider,
    });

    return NextResponse.json(
      {
        success: true,
        data: payment,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment payload.",
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

    console.error("Failed to create payment", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create payment.",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(
      request.nextUrl.searchParams.entries(),
    );
    const query = listQuerySchema.parse(searchParams);

    await connectToDatabase();

    const filter: Record<string, unknown> = {};

    if (query.provider) {
      filter.provider = query.provider;
    }

    if (query.status) {
      filter.status = query.status;
    }

    const skip = (query.page - 1) * query.limit;

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit),
      Payment.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: payments,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid query parameters.",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    console.error("Failed to list payments", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to list payments.",
      },
      { status: 500 },
    );
  }
}
