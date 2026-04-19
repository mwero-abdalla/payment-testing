import { type NextRequest, NextResponse } from "next/server";

import { syncPesapalIpn } from "../../../../../../../lib/pesapal-ipn";

function getBearerToken(authHeader: string | null): string {
  if (!authHeader?.startsWith("Bearer ")) {
    return "";
  }

  return authHeader.slice("Bearer ".length).trim();
}

export async function POST(request: NextRequest) {
  try {
    const expectedAdminKey = process.env.PESAPAL_SYNC_ADMIN_KEY;

    if (!expectedAdminKey) {
      return NextResponse.json(
        {
          success: false,
          message: "PESAPAL_SYNC_ADMIN_KEY is not configured.",
        },
        { status: 500 },
      );
    }

    const requestAdminKey =
      request.headers.get("x-admin-key") ||
      getBearerToken(request.headers.get("authorization"));

    if (!requestAdminKey || requestAdminKey !== expectedAdminKey) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    const webhookUrl = process.env.PESAPAL_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "PESAPAL_WEBHOOK_URL is not configured.",
        },
        { status: 400 },
      );
    }

    const synced = await syncPesapalIpn(webhookUrl);

    return NextResponse.json({
      success: true,
      message: "Pesapal IPN synced successfully.",
      data: synced,
    });
  } catch (error) {
    console.error("Failed to sync Pesapal IPN", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to sync Pesapal IPN.",
      },
      { status: 500 },
    );
  }
}
