import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  PesapalSyncError,
  syncPesapalPaymentStatus,
} from "@/lib/pesapal-payment-sync";

const callbackQuerySchema = z.object({
  orderTrackingId: z.string().optional(),
  OrderTrackingId: z.string().optional(),
  order_tracking_id: z.string().optional(),
  merchantReference: z.string().optional(),
  OrderMerchantReference: z.string().optional(),
  merchant_reference: z.string().optional(),
});

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
  return await syncPesapalPaymentStatus(trackingId, merchantReference);
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

    const synced = await processCallback(
      trackingId,
      extractMerchantReference(query),
    );

    const isSuccess = synced.orderStatus === "paid";
    const isPending = synced.orderStatus === "pending";

    const redirectUrl = new URL(
      isSuccess ? "/pesalink/success" : "/pesalink",
      request.url,
    );
    redirectUrl.searchParams.set("status", synced.orderStatus);
    redirectUrl.searchParams.set("orderId", synced.order?._id.toString() || "");

    if (!isSuccess && !isPending && synced.payment?.rawResponse) {
      // Pass the status description from the raw response if it exists
      const raw = synced.payment.rawResponse as any;
      const message =
        raw.payment_status_description || raw.message || "Payment failed";
      redirectUrl.searchParams.set("message", message);
    }

    return NextResponse.redirect(redirectUrl);
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

    if (error instanceof PesapalSyncError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: error.status },
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
