import { z } from "zod";
import { connectToDatabase } from "@/lib/mongoose";
import { AppConfig } from "@/models/AppConfig";
import { AbstractPaymentProvider } from "../base";
import type {
  IPNRegistrationResult,
  PaymentInitializationRequest,
  PaymentInitializationResult,
  PaymentStatus,
  PaymentVerificationResult,
} from "../types";

const authTokenResponseSchema = z.object({
  token: z.string(),
  expiryDate: z.string().optional(),
});

const initializePesapalResponseSchema = z.object({
  order_tracking_id: z.string(),
  merchant_reference: z.string(),
  redirect_url: z.string().url(),
  error: z
    .object({
      message: z.string().optional(),
    })
    .nullable()
    .optional(),
});

const verifyPesapalResponseSchema = z.object({
  payment_status_description: z.string().optional(),
  amount: z.number().optional(),
  currency: z.string().optional(),
  merchant_reference: z.string().optional(),
  tracking_id: z.string().optional(),
  payment_status_code: z
    .string()
    .or(z.number())
    .optional()
    .transform((v) => String(v)),
});

const registerPesapalIpnResponseSchema = z.object({
  ipn_id: z.string().optional(),
  ipn_url: z.string().optional(),
  url: z.string().optional(),
  status: z.string().optional(),
  error: z
    .object({
      message: z.string().optional(),
    })
    .nullable()
    .optional(),
});

export class PesapalProvider extends AbstractPaymentProvider {
  private static TOKEN_KEY = "pesapal.auth.token";

  constructor() {
    const baseURL =
      process.env.PESAPAL_BASE_URL ?? "https://cybqa.pesapal.com/pesapalv3";
    super(baseURL);
  }

  private async getAccessToken(): Promise<string> {
    await connectToDatabase();

    // Check DB for existing token
    const doc = await AppConfig.findOne({ key: PesapalProvider.TOKEN_KEY });
    if (doc?.value) {
      const { value, expiresAt } = doc.value as {
        value: string;
        expiresAt: number;
      };
      if (expiresAt > Date.now() + 30000) {
        return value;
      }
    }

    // Request new token
    const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
    const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;

    if (!consumerKey || !consumerSecret) {
      throw new Error(
        "PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET must be set.",
      );
    }

    const response = await this.client.post("/api/Auth/RequestToken", {
      consumer_key: consumerKey,
      consumer_secret: consumerSecret,
    });

    const parsed = authTokenResponseSchema.parse(response.data);
    const expiresAt = parsed.expiryDate
      ? new Date(parsed.expiryDate).getTime()
      : Date.now() + 4 * 60 * 1000;

    const newToken = { value: parsed.token, expiresAt };

    await AppConfig.findOneAndUpdate(
      { key: PesapalProvider.TOKEN_KEY },
      { key: PesapalProvider.TOKEN_KEY, value: newToken },
      { upsert: true },
    );

    return parsed.token;
  }

  async initialize(
    request: PaymentInitializationRequest,
  ): Promise<PaymentInitializationResult> {
    try {
      const token = await this.getAccessToken();

      const response = await this.client.post(
        "/api/Transactions/SubmitOrderRequest",
        {
          id: request.reference,
          currency: request.currency,
          amount: request.amount,
          description: request.description || "Order Payment",
          callback_url: request.callbackUrl,
          notification_id: request.notificationId || process.env.PESAPAL_IPN_ID,
          billing_address: {
            email_address: request.email,
            phone_number: request.phoneNumber || "",
            country_code: "KE",
            first_name: request.firstName || "Customer",
            last_name: request.lastName || "",
            line_1: "N/A",
            city: "Nairobi",
            state: "Nairobi",
            postal_code: "00100",
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const parsed = initializePesapalResponseSchema.parse(response.data);

      if (parsed.error?.message) {
        throw new Error(parsed.error.message);
      }

      return {
        success: true,
        reference: parsed.merchant_reference,
        trackingId: parsed.order_tracking_id,
        redirectUrl: parsed.redirect_url,
        rawResponse: response.data,
      };
    } catch (error) {
      return this.handleError(error, "Pesapal");
    }
  }

  async verify(trackingId: string): Promise<PaymentVerificationResult> {
    try {
      const token = await this.getAccessToken();

      const response = await this.client.get(
        `/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(trackingId)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const parsed = verifyPesapalResponseSchema.parse(response.data);

      return {
        success: true,
        reference: parsed.merchant_reference || "",
        trackingId: parsed.tracking_id || trackingId,
        status: this.mapStatus(parsed.payment_status_code),
        amount: parsed.amount || 0,
        currency: parsed.currency || "KES",
        message: parsed.payment_status_description,
        rawResponse: response.data,
      };
    } catch (error) {
      return this.handleError(error, "Pesapal");
    }
  }

  async registerIpn(webhookUrl: string): Promise<IPNRegistrationResult> {
    try {
      const token = await this.getAccessToken();

      const response = await this.client.post(
        "/api/URLSetup/RegisterIPN",
        {
          url: webhookUrl,
          ipn_notification_type: "POST",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const parsed = registerPesapalIpnResponseSchema.parse(response.data);

      if (parsed.error?.message) {
        throw new Error(parsed.error.message);
      }

      return {
        success: true,
        ipnId: parsed.ipn_id!,
        url: parsed.ipn_url || parsed.url || webhookUrl,
        status: parsed.status,
        rawResponse: response.data,
      };
    } catch (error) {
      return this.handleError(error, "Pesapal");
    }
  }

  async listIpns(): Promise<
    Array<{ ipnId: string; url: string; status?: string }>
  > {
    try {
      const token = await this.getAccessToken();

      const response = await this.client.get("/api/URLSetup/GetIpnList", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const entries = Array.isArray(response.data)
        ? response.data
        : (response.data.data ?? []);
      return entries
        .map((entry: any) => ({
          ipnId: entry.ipn_id,
          url: entry.ipn_url || entry.url,
          status: entry.status,
        }))
        .filter((e: any) => e.ipnId && e.url);
    } catch (error) {
      return this.handleError(error, "Pesapal");
    }
  }

  async resolveOrRegisterIpn(
    webhookUrl: string,
  ): Promise<{ ipnId: string; url: string; status?: string }> {
    const existing = (await this.listIpns()).find(
      (entry) => entry.url === webhookUrl,
    );

    if (existing) {
      return existing;
    }

    const registered = await this.registerIpn(webhookUrl);
    return {
      ipnId: registered.ipnId,
      url: registered.url,
      status: registered.status,
    };
  }

  private mapStatus(statusCode?: string): PaymentStatus {
    switch (statusCode) {
      case "1":
        return "successful";
      case "3":
        return "failed";
      case "2":
        return "cancelled";
      case "0":
      default:
        return "pending";
    }
  }
}
