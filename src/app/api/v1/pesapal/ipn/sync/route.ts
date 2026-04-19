import { isAxiosError } from "axios";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { syncPesapalIpn } from "@/lib/pesapal-ipn";

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
    if (isAxiosError(error)) {
      const status = error.response?.status ?? 500;
      const data = error.response?.data;
      const message =
        typeof data === "object" && data !== null && "message" in data
          ? String(data.message)
          : error.message;

      console.error("Pesapal API error details:", {
        status,
        data,
        message: error.message,
      });

      return NextResponse.json(
        {
          success: false,
          message: `Pesapal API error: ${message}`,
          details: data,
        },
        { status },
      );
    }

    if (error instanceof z.ZodError) {
      console.error("Validation error during Pesapal sync:", error.issues);
      return NextResponse.json(
        {
          success: false,
          message: "Internal validation error during Pesapal sync.",
          issues: error.issues,
        },
        { status: 500 },
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to sync Pesapal IPN:", error);

    return NextResponse.json(
      {
        success: false,
        message: `Failed to sync Pesapal IPN: ${errorMessage}`,
      },
      { status: 500 },
    );
  }
}
