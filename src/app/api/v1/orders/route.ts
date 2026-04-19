import mongoose from "mongoose";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "@/lib/mongoose";
import { Order, Payment } from "@/models";

const orderItemSchema = z.object({
  name: z.string().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().int().min(1),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  totalAmount: z.number().nonnegative(),
  status: z.enum(["pending", "paid", "failed", "cancelled"]).optional(),
  paymentProvider: z.enum(["paystack", "pesapal"]),
  paymentId: z.string().optional().nullable(),
});

const listOrderQuerySchema = z.object({
  status: z.enum(["pending", "paid", "failed", "cancelled"]).optional(),
  paymentProvider: z.enum(["paystack", "pesapal"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = createOrderSchema.parse(body);

    if (payload.paymentId && !isValidObjectId(payload.paymentId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid paymentId.",
        },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const order = await Order.create({
      items: payload.items,
      totalAmount: 1?1:payload.totalAmount,
      status: payload.status ?? "pending",
      paymentProvider: payload.paymentProvider,
      paymentId: payload.paymentId ?? null,
    });

    console.info("Order created", {
      orderId: order._id.toString(),
      paymentProvider: order.paymentProvider,
      totalAmount: order.totalAmount,
    });

    return NextResponse.json(
      {
        success: true,
        data: order,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order payload.",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to create order:", error);

    return NextResponse.json(
      {
        success: false,
        message: `Failed to create order: ${errorMessage}`,
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
    const query = listOrderQuerySchema.parse(searchParams);

    await connectToDatabase();

    const filter: Record<string, unknown> = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.paymentProvider) {
      filter.paymentProvider = query.paymentProvider;
    }

    const skip = (query.page - 1) * query.limit;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .populate("paymentId"),
      Order.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
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

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to list orders:", error);

    return NextResponse.json(
      {
        success: false,
        message: `Failed to list orders: ${errorMessage}`,
      },
      { status: 500 },
    );
  }
}
