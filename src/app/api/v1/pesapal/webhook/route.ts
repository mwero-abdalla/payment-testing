import { type NextRequest, NextResponse } from "next/server";

import {
  PesapalSyncError,
  syncPesapalPaymentStatus,
} from "../../../../../../lib/pesapal-payment-sync";

type PesapalIncomingPayload = {
  orderTrackingId?: string;
  OrderTrackingId?: string;
  order_tracking_id?: string;
  tracking_id?: string;
  merchantReference?: string;
  OrderMerchantReference?: string;
  merchant_reference?: string;
  [key: string]: unknown;
};

function toObjectFromSearchParams(searchParams: URLSearchParams) {
  return Object.fromEntries(searchParams.entries());
}

async function parseIncomingPayload(
  request: NextRequest,
): Promise<PesapalIncomingPayload> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("application/json")) {
    const json = (await request.json()) as unknown;

    if (json && typeof json === "object") {
      return json as PesapalIncomingPayload;
    }

    return {};
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await request.text();
    return toObjectFromSearchParams(new URLSearchParams(text));
  }

  return {};
}

function extractTrackingId(payload: PesapalIncomingPayload): string {
  return (
    payload.orderTrackingId ??
    payload.OrderTrackingId ??
    payload.order_tracking_id ??
    payload.tracking_id ??
    ""
  );
}

function extractMerchantReference(
  payload: PesapalIncomingPayload,
): string | undefined {
  return (
    payload.merchantReference ??
    payload.OrderMerchantReference ??
    payload.merchant_reference
  );
}

export async function POST(request: NextRequest) {
  try {
    const bodyPayload = await parseIncomingPayload(request);
    const queryPayload = toObjectFromSearchParams(request.nextUrl.searchParams);

    const mergedPayload: PesapalIncomingPayload = {
      ...queryPayload,
      ...bodyPayload,
    };

    const trackingId = extractTrackingId(mergedPayload);

    if (!trackingId) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing orderTrackingId in webhook payload.",
        },
        { status: 400 },
      );
    }

    const synced = await syncPesapalPaymentStatus(
      trackingId,
      extractMerchantReference(mergedPayload),
    );

    console.info("Pesapal payment webhook processed", {
      paymentId: synced.payment._id.toString(),
      orderId: synced.order?._id.toString() ?? null,
      reference: synced.reference,
      trackingId: synced.trackingId,
      paymentStatus: synced.paymentStatus,
      orderStatus: synced.orderStatus,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...synced,
      },
    });
  } catch (error) {
    if (error instanceof PesapalSyncError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: error.status },
      );
    }

    console.error("Failed to process Pesapal webhook", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to process Pesapal webhook.",
      },
      { status: 500 },
    );
  }
}
