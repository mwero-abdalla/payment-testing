import mongoose from "mongoose";
import { type NextRequest, NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongoose";
import { Order } from "@/models/Order";

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
          message: "Invalid order id.",
        },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const order = await Order.findById(id).populate("paymentId");

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Failed to fetch order", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch order.",
      },
      { status: 500 },
    );
  }
}
