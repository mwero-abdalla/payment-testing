import { AbstractPaymentProvider } from "../base";
import { 
  type PaymentInitializationRequest, 
  type PaymentInitializationResult, 
  type PaymentVerificationResult,
  type PaymentStatus
} from "../types";
import { z } from "zod";

const paystackInitializeResponseSchema = z.object({
  status: z.boolean(),
  message: z.string(),
  data: z.object({
    authorization_url: z.string().url(),
    access_code: z.string(),
    reference: z.string(),
  }),
});

const paystackVerifyResponseSchema = z.object({
  status: z.boolean(),
  message: z.string(),
  data: z.object({
    status: z.string(),
    reference: z.string(),
    amount: z.number(),
    currency: z.string(),
    paid_at: z.string().nullable().optional(),
    channel: z.string().nullable().optional(),
    metadata: z.unknown().optional(),
  }),
});

export class PaystackProvider extends AbstractPaymentProvider {
  constructor() {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const baseURL = process.env.PAYSTACK_BASE_URL ?? "https://api.paystack.co";

    if (!secretKey) {
      throw new Error("PAYSTACK_SECRET_KEY is not set.");
    }

    super(baseURL);
    
    this.client.defaults.headers.common["Authorization"] = `Bearer ${secretKey}`;
  }

  async initialize(request: PaymentInitializationRequest): Promise<PaymentInitializationResult> {
    try {
      const response = await this.client.post("/transaction/initialize", {
        email: request.email,
        amount: this.toMinorUnits(request.amount),
        reference: request.reference,
        currency: request.currency,
        callback_url: request.callbackUrl,
        metadata: request.metadata,
      });

      const parsed = paystackInitializeResponseSchema.parse(response.data);

      return {
        success: parsed.status,
        reference: parsed.data.reference,
        trackingId: parsed.data.access_code,
        authorizationUrl: parsed.data.authorization_url,
        message: parsed.message,
        rawResponse: response.data,
      };
    } catch (error) {
      return this.handleError(error, "Paystack");
    }
  }

  async verify(reference: string): Promise<PaymentVerificationResult> {
    try {
      const response = await this.client.get(`/transaction/verify/${reference}`);
      const parsed = paystackVerifyResponseSchema.parse(response.data);

      return {
        success: parsed.status,
        reference: parsed.data.reference,
        trackingId: parsed.data.reference,
        status: this.mapStatus(parsed.data.status),
        amount: this.fromMinorUnits(parsed.data.amount),
        currency: parsed.data.currency,
        paidAt: parsed.data.paid_at,
        message: parsed.message,
        rawResponse: response.data,
      };
    } catch (error) {
      return this.handleError(error, "Paystack");
    }
  }

  private mapStatus(paystackStatus: string): PaymentStatus {
    switch (paystackStatus) {
      case "success":
        return "successful";
      case "failed":
        return "failed";
      case "reversed":
        return "cancelled";
      default:
        return "pending";
    }
  }
}
