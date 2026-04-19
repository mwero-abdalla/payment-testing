import axios, { type AxiosInstance } from "axios";
import { z } from "zod";

function createPaystackClient(): AxiosInstance {
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!paystackSecretKey) {
    throw new Error(
      "PAYSTACK_SECRET_KEY is not set. Please define it in your environment.",
    );
  }

  return axios.create({
    baseURL: process.env.PAYSTACK_BASE_URL ?? "https://api.paystack.co",
    headers: {
      Authorization: `Bearer ${paystackSecretKey}`,
      "Content-Type": "application/json",
    },
    timeout: 15000,
  });
}

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

export type InitializePaystackTransactionInput = {
  email: string;
  amount: number;
  reference: string;
  currency?: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
};

export type VerifyPaystackTransactionResult = {
  reference: string;
  status: string;
  amount: number;
  currency: string;
  paidAt: string | null;
  rawResponse: unknown;
};

export async function initializeTransaction(
  payload: InitializePaystackTransactionInput,
) {
  const paystackClient = createPaystackClient();
  const amountInMinorUnits = Math.round(payload.amount * 100);

  if (amountInMinorUnits <= 0) {
    throw new Error("Paystack initialization requires amount greater than 0.");
  }

  const response = await paystackClient.post("/transaction/initialize", {
    email: payload.email,
    amount: amountInMinorUnits,
    reference: payload.reference,
    currency: payload.currency ?? "KES",
    callback_url: payload.callbackUrl ?? process.env.PAYSTACK_CALLBACK_URL,
    metadata: payload.metadata,
  });

  const parsed = paystackInitializeResponseSchema.parse(response.data);

  return {
    authorizationUrl: parsed.data.authorization_url,
    accessCode: parsed.data.access_code,
    reference: parsed.data.reference,
    rawResponse: response.data,
  };
}

export async function verifyTransaction(
  reference: string,
): Promise<VerifyPaystackTransactionResult> {
  const paystackClient = createPaystackClient();

  if (!reference) {
    throw new Error("Paystack verification requires a transaction reference.");
  }

  const response = await paystackClient.get(`/transaction/verify/${reference}`);
  const parsed = paystackVerifyResponseSchema.parse(response.data);

  return {
    reference: parsed.data.reference,
    status: parsed.data.status,
    amount: parsed.data.amount / 100,
    currency: parsed.data.currency,
    paidAt: parsed.data.paid_at ?? null,
    rawResponse: response.data,
  };
}
